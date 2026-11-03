import React, { useState, useEffect } from "react";
import { AuthContext } from "./authContextInstance";
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
} from "../firebase/config";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Helper to fetch user profile document from Firestore
  const fetchUserProfile = async (uid) => {
    if (!db || !uid) return null;
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching user profile from Firestore:", err);
    }
    return null;
  };

  // Helper to sync or create user profile in Firestore
  const syncUserProfile = async (user, additionalData = {}) => {
    if (!db || !user) return null;
    const userRef = doc(db, "users", user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const generatedUsername =
          additionalData.username ||
          (user.email ? user.email.split("@")[0].toLowerCase() : `user_${user.uid.slice(0, 6)}`);

        const newProfile = {
          uid: user.uid,
          fullName: additionalData.fullName || user.displayName || "Dairy Farmer",
          username: generatedUsername,
          email: user.email || additionalData.email || "",
          phoneNumber: user.phoneNumber || additionalData.phoneNumber || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, newProfile);

        // Also record username mapping in lowercase
        if (generatedUsername) {
          const usernameRef = doc(db, "usernames", generatedUsername.toLowerCase());
          await setDoc(usernameRef, {
            uid: user.uid,
            email: user.email || additionalData.email || "",
            createdAt: serverTimestamp(),
          });
        }

        setUserProfile(newProfile);
        return newProfile;
      } else {
        const existingData = snap.data();
        setUserProfile(existingData);
        return existingData;
      }
    } catch (err) {
      console.error("Error saving user profile to Firestore:", err);
      return null;
    }
  };

  // Listen to auth state changes and maintain persistent session
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          try {
            setCurrentUser(user);
            if (user) {
              await fetchUserProfile(user.uid);
            } else {
              setUserProfile(null);
            }
          } catch (profileErr) {
            console.warn("User profile fetch error:", profileErr);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.warn("Firebase Auth state error:", error?.message || error);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn("Failed to attach auth state listener:", e);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // 1. Google Sign-In & Sign-Up
  const loginWithGoogle = async () => {
    setAuthError("");
    if (!auth || !googleProvider) {
      throw new Error("Firebase Authentication is not configured.");
    }
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  };

  // 2. Mobile Phone Authentication with OTP & reCAPTCHA
  const setupRecaptcha = (containerId = "recaptcha-container") => {
    if (!auth) throw new Error("Firebase Authentication is not configured.");
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Ignore reset errors
      }
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        setAuthError("reCAPTCHA expired. Please try sending OTP again.");
      },
    });
    return window.recaptchaVerifier;
  };

  const sendPhoneOtp = async (phoneNumber, appVerifier) => {
    setAuthError("");
    if (!auth) throw new Error("Firebase Authentication is not configured.");
    const verifier = appVerifier || window.recaptchaVerifier || setupRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  };

  const verifyPhoneOtp = async (confirmationResult, otpCode, additionalData = {}) => {
    setAuthError("");
    if (!confirmationResult && !window.confirmationResult) {
      throw new Error("No active OTP request found. Please request a new OTP.");
    }
    const activeConfirmation = confirmationResult || window.confirmationResult;
    const result = await activeConfirmation.confirm(otpCode);
    await syncUserProfile(result.user, additionalData);
    return result.user;
  };

  // 3. Username & Password Registration (Prevents duplicate usernames atomically)
  const registerWithUsername = async ({ fullName, username, password, email, phoneNumber }) => {
    setAuthError("");
    if (!auth || !db) throw new Error("Firebase is not configured.");

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) throw new Error("Please enter a valid username.");
    if (cleanUsername.includes("@") || cleanUsername.includes(" ")) {
      throw new Error("Username cannot contain spaces or '@' symbol.");
    }

    const primaryEmail = (email && email.trim()) || `${cleanUsername}@galaxydairy.app`;

    // Atomic uniqueness check via Firestore transaction
    const usernameDocRef = doc(db, "usernames", cleanUsername);

    await runTransaction(db, async (transaction) => {
      const usernameSnap = await transaction.get(usernameDocRef);
      if (usernameSnap.exists()) {
        throw new Error(`Username "${cleanUsername}" is already taken. Please choose another.`);
      }
    });

    // Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, primaryEmail, password);
    const user = cred.user;

    // Update Auth display name
    await updateProfile(user, { displayName: fullName });

    // Store in users collection and usernames index
    const userDocRef = doc(db, "users", user.uid);
    const profilePayload = {
      uid: user.uid,
      fullName: fullName.trim(),
      username: cleanUsername,
      email: primaryEmail,
      phoneNumber: (phoneNumber && phoneNumber.trim()) || "",
      photoURL: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profilePayload);
    await setDoc(usernameDocRef, {
      uid: user.uid,
      email: primaryEmail,
      createdAt: serverTimestamp(),
    });

    setUserProfile(profilePayload);
    return user;
  };

  // 4. Username or Email Login
  const loginWithUsernameOrEmail = async (identifier, password) => {
    setAuthError("");
    if (!auth || !db) throw new Error("Firebase is not configured.");

    const cleanIdentifier = identifier.trim();
    let loginEmail = cleanIdentifier;

    // If identifier is a username (no '@'), look up registered email in Firestore
    if (!cleanIdentifier.includes("@")) {
      const cleanUsername = cleanIdentifier.toLowerCase();
      const usernameDocRef = doc(db, "usernames", cleanUsername);
      const usernameSnap = await getDoc(usernameDocRef);

      if (!usernameSnap.exists()) {
        throw new Error(`Username "${cleanIdentifier}" not found. Please check your username.`);
      }
      loginEmail = usernameSnap.data().email;
    }

    const cred = await signInWithEmailAndPassword(auth, loginEmail, password);
    await fetchUserProfile(cred.user.uid);
    return cred.user;
  };

  // 5. Password Reset
  const resetPassword = async (emailOrUsername) => {
    setAuthError("");
    if (!auth || !db) throw new Error("Firebase is not configured.");

    const cleanInput = emailOrUsername.trim();
    let targetEmail = cleanInput;

    if (!cleanInput.includes("@")) {
      const usernameDocRef = doc(db, "usernames", cleanInput.toLowerCase());
      const usernameSnap = await getDoc(usernameDocRef);
      if (!usernameSnap.exists()) {
        throw new Error(`Username "${cleanInput}" not found.`);
      }
      targetEmail = usernameSnap.data().email;
    }

    await sendPasswordResetEmail(auth, targetEmail);
    return targetEmail;
  };

  // 6. Profile Management
  const updateUserProfileData = async (updatedFields) => {
    setAuthError("");
    if (!currentUser || !db) throw new Error("No authenticated user.");

    const userRef = doc(db, "users", currentUser.uid);
    const updates = {
      ...updatedFields,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updates);

    // Sync Auth Display Name if fullName was modified
    if (updatedFields.fullName) {
      await updateProfile(currentUser, { displayName: updatedFields.fullName });
    }

    setUserProfile((prev) => ({
      ...prev,
      ...updatedFields,
    }));

    return true;
  };

  // 7. Logout
  const logout = async () => {
    setAuthError("");
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    setAuthError,
    isFirebaseConfigured,
    loginWithGoogle,
    setupRecaptcha,
    sendPhoneOtp,
    verifyPhoneOtp,
    registerWithUsername,
    loginWithUsernameOrEmail,
    resetPassword,
    updateUserProfileData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
