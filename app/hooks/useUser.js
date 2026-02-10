import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";

export function useUser() {
  return useAuthState(auth);
}
