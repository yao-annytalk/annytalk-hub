import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

export const useMakeups = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. CREATE MAKEUP (Auto-sets 30 Day Expiry)
  const createMakeup = async (studentId, coach, className) => {
    setLoading(true);
    try {
      const studentRef = doc(db, 'students', studentId);
      
      const newCredit = {
        id: Date.now().toString(), // Simple unique ID
        missedCoach: coach,
        missedClass: className,
        assignedClass: null, // Starts unassigned
        status: 'available', // available | assigned | used
        createdAt: new Date().toISOString(),
        // 🔥 Rule: Expires 30 days from creation
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      };

      await updateDoc(studentRef, {
        makeupCredits: arrayUnion(newCredit)
      });
      return newCredit;
    } catch (err) {
      console.error("Error creating makeup:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. ASSIGN MAKEUP (Updates the credit with class details)
  const assignMakeup = async (studentId, oldCredit, classDetails) => {
    setLoading(true);
    try {
      const studentRef = doc(db, 'students', studentId);

      // Firestore arrays are primitive; we must remove the old object and add the new one
      await updateDoc(studentRef, {
        makeupCredits: arrayRemove(oldCredit)
      });

      const updatedCredit = {
        ...oldCredit,
        status: 'assigned',
        assignedClass: {
          day: classDetails.day,
          time: classDetails.time,
          coach: classDetails.coach,
          date: classDetails.date,
          note: classDetails.note || ''
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(studentRef, {
        makeupCredits: arrayUnion(updatedCredit)
      });
    } catch (err) {
      console.error("Error assigning makeup:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. REDEEM MAKEUP (Mark as used/done)
  const redeemMakeup = async (studentId, credit) => {
    setLoading(true);
    try {
      const studentRef = doc(db, 'students', studentId);

      // Remove the active/assigned credit
      await updateDoc(studentRef, {
        makeupCredits: arrayRemove(credit)
      });

      // You can either:
      // A) Add it back as 'used' (History tracking)
      // B) Delete it entirely (Cleaner array)
      
      // Option A: Keep history
      const usedCredit = {
        ...credit,
        status: 'used',
        usedAt: new Date().toISOString()
      };
      
      await updateDoc(studentRef, {
        makeupCredits: arrayUnion(usedCredit)
      });

    } catch (err) {
      console.error("Error redeeming makeup:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. DELETE MAKEUP (Admin cleanup)
  const deleteMakeup = async (studentId, credit) => {
    if(!confirm("Permanently delete this credit?")) return;
    setLoading(true);
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        makeupCredits: arrayRemove(credit)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    createMakeup, 
    assignMakeup, 
    redeemMakeup, 
    deleteMakeup,
    loading, 
    error 
  };
};