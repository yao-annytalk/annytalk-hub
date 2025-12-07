import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// 🔥 ANNYTALK HUB CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyBuYDRdDQoNTloikWAfwGwr99Xuhw1A374",
  authDomain: "annytalkhub.firebaseapp.com",
  projectId: "annytalkhub",
  storageBucket: "annytalkhub.firebasestorage.app",
  messagingSenderId: "306466515120",
  appId: "1:306466515120:web:896ac61d38022c0487b375",
  measurementId: "G-6P4PNRCWW7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔥 CONNECT TO EMULATORS (Development Only)
if (location.hostname === "localhost") {
  console.log("🔧 Using Local Emulator Suite for AnnyTalk Hub");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}