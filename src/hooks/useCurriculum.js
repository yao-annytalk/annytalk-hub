import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

export const useCurriculum = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all curriculum templates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'curriculums'), (snap) => {
      setCurriculums(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Create a new Curriculum (e.g. "Speaking Level 1")
  const createCurriculum = async (name, level, totalWeeks) => {
    const id = `${name}_${level}`.replace(/\s+/g, '_').toUpperCase();
    // Generate empty weeks
    const weeks = Array.from({ length: totalWeeks }, (_, i) => ({
      week: i + 1,
      topic: `Lesson ${i + 1}`,
      materials: ""
    }));

    await setDoc(doc(db, 'curriculums', id), {
      name,
      level,
      weeks,
      createdAt: new Date().toISOString()
    });
  };

  // Update a specific lesson topic
  const updateLesson = async (curriculumId, updatedWeeks) => {
    const ref = doc(db, 'curriculums', curriculumId);
    await updateDoc(ref, { weeks: updatedWeeks });
  };

  return { curriculums, loading, createCurriculum, updateLesson };
};