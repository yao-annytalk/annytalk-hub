import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to the "leads" collection in Firestore in real-time
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addLead = async (leadData) => {
    await addDoc(collection(db, 'leads'), {
      ...leadData,
      status: 'New',
      probability: 0.3,
      createdAt: new Date().toISOString()
    });
  };

  const updateLeadStatus = async (id, status) => {
    const ref = doc(db, 'leads', id);
    // Simple logic: Won = 100%, Lost = 0%, Others = 50%
    const prob = status === 'Won' ? 1.0 : status === 'Lost' ? 0.0 : 0.5;
    
    await updateDoc(ref, { 
      status, 
      probability: prob, 
      updatedAt: new Date().toISOString() 
    });
  };

  return { leads, loading, addLead, updateLeadStatus };
};