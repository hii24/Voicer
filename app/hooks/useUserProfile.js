import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useUserProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setMissing(false);
      return undefined;
    }

    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const exists = snapshot.exists();
        setProfile(exists ? snapshot.data() : null);
        setMissing(!exists);
        setLoading(false);
      },
      () => {
        setMissing(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { profile, loading, missing };
}
