import { getDoc, getDocs, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const CACHE = {};
const TTL = 1000 * 60 * 5; // 5 minutes

function isFresh(key) {
  const entry = CACHE[key];
  if (!entry) return false;
  return (Date.now() - entry.ts) < TTL;
}

export async function getDocOnce(path, id) {
  const key = `doc:${path}/${id}`;
  if (isFresh(key)) return CACHE[key].data;
  const ref = doc(db, path, id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  CACHE[key] = { ts: Date.now(), data };
  return data;
}

export async function getCollectionOnce(path) {
  const key = `col:${path}`;
  if (isFresh(key)) return CACHE[key].data;
  const colRef = collection(db, path);
  const snap = await getDocs(colRef);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  CACHE[key] = { ts: Date.now(), data };
  return data;
}

export function invalidate(path) {
  // remove cached entries for path
  Object.keys(CACHE).forEach(k => { if (k.includes(path)) delete CACHE[k]; });
}
