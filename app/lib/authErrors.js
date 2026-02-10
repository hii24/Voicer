export function mapAuthError(error, mode = "login") {
  const code = error?.code || "";

  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Try signing in instead.";
  }
  if (code === "auth/invalid-email") {
    return "Invalid email address.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (code === "auth/user-not-found") {
    return "Account not found. Check your email or sign up.";
  }
  if (code === "auth/wrong-password") {
    return "Wrong password. Try again.";
  }
  if (code === "auth/user-disabled") {
    return "This account is disabled. Contact support.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again позже.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email/password auth is not enabled in Firebase.";
  }

  if (mode === "register") {
    return "Registration failed. Please try again.";
  }
  return "Authentication failed. Please try again.";
}
