import { collection, query, where, getDocs, writeBatch, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export const useCredits = () => {
  
  // Deduct hours from the oldest active package
  const deductCredits = async (studentId, amount) => {
    try {
      const creditsRef = collection(db, `students/${studentId}/credits`);
      // Find active packages with hours remaining
      const q = query(creditsRef, where("hoursRemaining", ">", 0));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) throw new Error("No active credits found for student.");

      // Sort by purchase date (Oldest first - FIFO)
      const sortedCredits = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(a.purchasedAt) - new Date(b.purchasedAt));

      let remainingToDeduct = amount;
      const batch = writeBatch(db);

      for (const credit of sortedCredits) {
        if (remainingToDeduct <= 0) break;

        const deduction = Math.min(credit.hoursRemaining, remainingToDeduct);
        const creditDocRef = doc(db, `students/${studentId}/credits`, credit.id);
        
        batch.update(creditDocRef, { hoursRemaining: increment(-deduction) });
        
        // Update Student Global Counter (Optional but good for quick UI)
        const studentRef = doc(db, 'students', studentId);
        batch.update(studentRef, { totalRemainingHours: increment(-deduction) });

        remainingToDeduct -= deduction;
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Deduction Error:", error);
      throw error;
    }
  };

  return { deductCredits };
};