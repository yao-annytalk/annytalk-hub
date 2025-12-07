import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { COACH_LIST } from '../utils/scheduleConstants';
import { getDocOnce, invalidate } from '../utils/firestoreCache';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    coaches: [],
    classTypes: []
  });
  const [loading, setLoading] = useState(true);

  const SETTINGS_ID = 'school_config';

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Using cached one-time fetch to reduce reads
        const data = await getDocOnce('settings', SETTINGS_ID);
        if (!mounted) return;
        if (data) {
          setSettings({
            coaches: data.coaches || [],
            classTypes: data.classTypes || []
          });
        } else {
          // default
          setSettings({ coaches: COACH_LIST, classTypes: [] });
        }
      } catch (e) {
        console.error('useSettings fetch error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const addCoach = async (name) => {
    const ref = doc(db, 'settings', SETTINGS_ID);
    await updateDoc(ref, { coaches: arrayUnion(name) });
    invalidate('settings'); // invalidate cache so next read refreshes
  };

  const removeCoach = async (name) => {
    const ref = doc(db, 'settings', SETTINGS_ID);
    await updateDoc(ref, { coaches: arrayRemove(name) });
    invalidate('settings');
  };

  const addClassType = async (type) => {
    const ref = doc(db, 'settings', SETTINGS_ID);
    await updateDoc(ref, { classTypes: arrayUnion(type) });
    invalidate('settings');
  };

  const removeClassType = async (type) => {
    const ref = doc(db, 'settings', SETTINGS_ID);
    await updateDoc(ref, { classTypes: arrayRemove(type) });
    invalidate('settings');
  };

  return { settings, loading, addCoach, removeCoach, addClassType, removeClassType };
};
