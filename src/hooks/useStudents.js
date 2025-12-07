import { useState, useEffect, useCallback } from 'react';
import { 
  collection, addDoc, doc, updateDoc, increment, writeBatch, 
  query, where, getDocs, arrayUnion, arrayRemove, getDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

// 🔥 GLOBAL CACHE: Stores data in memory so we don't pay for reads when switching pages
let studentCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes before auto-refresh

export const useStudents = () => {
  const [students, setStudents] = useState(studentCache || []);
  const [loading, setLoading] = useState(!studentCache);

  // --- SMART FETCH ---
  const refreshStudents = useCallback(async (force = false) => {
    const now = Date.now();
    // If we have data and it's fresh (less than 5 mins old), use Cache (Free!)
    if (!force && studentCache && (now - lastFetchTime < CACHE_DURATION)) {
      setStudents(studentCache);
      setLoading(false);
      return;
    }

    // Otherwise, read from Firebase (Costs Quota)
    try {
      const q = query(collection(db, 'students'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update Global Cache
      studentCache = data;
      lastFetchTime = now;
      
      setStudents(data);
    } catch (err) {
      console.error("Quota Error or Network Fail:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  // --- HELPERS: Update Cache Manually (So UI updates without re-fetching DB) ---
  const updateLocalCache = (id, newData) => {
    if (!studentCache) return;
    studentCache = studentCache.map(s => s.id === id ? { ...s, ...newData } : s);
    setStudents([...studentCache]);
  };

  const addToLocalCache = (newDoc) => {
    if (!studentCache) studentCache = [];
    studentCache.push(newDoc);
    setStudents([...studentCache]);
  };

  const removeFromLocalCache = (id) => {
    if (!studentCache) return;
    studentCache = studentCache.filter(s => s.id !== id);
    setStudents([...studentCache]);
  };

  // --- CRUD OPERATIONS ---
  
  const addStudent = async (studentData) => {
    const newStudent = {
      ...studentData,
      credits: Number(studentData.credits) || 0,
      totalHours: Number(studentData.totalHours) || 0,
      usedHours: Number(studentData.usedHours) || 0,
      scholarshipStatus: studentData.scholarshipStatus || 'none',
      freeHoursTotal: Number(studentData.freeHoursTotal) || 0,
      freeHoursUsed: 0,
      makeupCredits: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'students'), newStudent);
    addToLocalCache({ id: docRef.id, ...newStudent }); // Update UI instantly
  };

  const updateStudent = async (id, data) => {
    const ref = doc(db, 'students', id);
    await updateDoc(ref, data);
    updateLocalCache(id, data); // Update UI instantly
  };

  const deleteStudent = async (id) => {
    const ref = doc(db, 'students', id);
    await deleteDoc(ref);
    removeFromLocalCache(id); // Update UI instantly
  };

  // --- COMPLEX LOGIC (Still fetches fresh data for safety) ---
  
  const deductCredit = async (studentId, amount = 1) => {
    const studentRef = doc(db, 'students', studentId);
    // We fetch fresh single doc here to ensure credit balance is atomic/accurate
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) return;
    const s = studentSnap.data();

    // Apply logic (Scholarship/Reward check)
    if (s.scholarshipStatus === 'scholarship' || s.scholarshipStatus === 'special') return;

    let updates = {};

    if (s.scholarshipStatus === 'reward') {
      const remainingFree = (s.freeHoursTotal || 0) - (s.freeHoursUsed || 0);
      if (remainingFree > 0) {
        const freeDeduction = Math.min(remainingFree, amount);
        const normalDeduction = amount - freeDeduction;
        updates.freeHoursUsed = increment(freeDeduction);
        if (normalDeduction > 0) {
          updates.credits = increment(-normalDeduction);
          updates.usedHours = increment(normalDeduction);
        }
      } else {
         updates.credits = increment(-amount);
         updates.usedHours = increment(amount);
      }
    } else {
      updates.credits = increment(-amount);
      updates.usedHours = increment(amount);
    }

    await updateDoc(studentRef, updates);
    // Refresh this specific student in cache to reflect new balance
    const updatedSnap = await getDoc(studentRef);
    updateLocalCache(studentId, updatedSnap.data());
  };

  // --- MAKEUP SYSTEM ---
  
  const addMakeupCredit = async (studentId, coach, className) => {
    const ref = doc(db, 'students', studentId);
    const newCredit = {
      id: Date.now().toString(),
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      missedCoach: coach,
      missedClass: className,
      assignedClass: null,
      status: 'available'
    };
    await updateDoc(ref, { makeupCredits: arrayUnion(newCredit) });
    // We force a full refresh here as array operations are hard to patch locally
    refreshStudents(true); 
  };

  const assignMakeupClass = async (studentId, credit, classDetails) => {
    const ref = doc(db, 'students', studentId);
    const cleanCredit = { ...credit }; 
    delete cleanCredit.studentId; 
    delete cleanCredit.studentName; 
    delete cleanCredit.currentStatus;

    await updateDoc(ref, { makeupCredits: arrayRemove(cleanCredit) });
    
    const updatedCredit = { ...cleanCredit, status: 'assigned', assignedClass: classDetails };
    await updateDoc(ref, { makeupCredits: arrayUnion(updatedCredit) });
    
    refreshStudents(true);
  };

  const redeemMakeup = async (studentId, credit) => {
    const ref = doc(db, 'students', studentId);
    const cleanCredit = { ...credit }; 
    delete cleanCredit.studentId; delete cleanCredit.studentName; delete cleanCredit.currentStatus;
    
    await updateDoc(ref, { makeupCredits: arrayRemove(cleanCredit) });
    refreshStudents(true);
  };

  const deleteMakeupCredit = async (studentId, credit) => {
    const ref = doc(db, 'students', studentId);
    const cleanCredit = { ...credit }; 
    delete cleanCredit.studentId; delete cleanCredit.studentName; delete cleanCredit.currentStatus;

    await updateDoc(ref, { makeupCredits: arrayRemove(cleanCredit) });
    refreshStudents(true);
  };

  // --- IMPORT ---
  const importStudentsFromCRM = async (cleanData) => {
    const chunkSize = 450;
    for (let i = 0; i < cleanData.length; i += chunkSize) {
      const chunk = cleanData.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(row => {
        const docRef = doc(collection(db, "students"));
        batch.set(docRef, {
          ...row,
          studentName: row.studentName,
          credits: Number(row.credits) || 0,
          makeupCredits: [],
          status: 'active',
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    }
    refreshStudents(true); // Force update after import
  };

  return { 
    students, loading, 
    addStudent, updateStudent, deleteStudent, 
    importStudentsFromCRM,
    deductCredit, addMakeupCredit, assignMakeupClass, redeemMakeup, deleteMakeupCredit 
  };
};