import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useAiAccess(uid: string): boolean {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!uid) { setHasAccess(false); return; }
    return onSnapshot(
      doc(db, 'aiAccess', uid),
      (snap) => setHasAccess(snap.exists() && snap.data()?.enabled === true),
      () => setHasAccess(false),
    );
  }, [uid]);

  return hasAccess;
}
