import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0ePv7ajj9XV0ZO1EaQbF1rj1Xf1XWk9I",
  authDomain: "incometracker-33b6b.firebaseapp.com",
  projectId: "incometracker-33b6b",
  storageBucket: "incometracker-33b6b.firebasestorage.app",
  messagingSenderId: "560340083615",
  appId: "1:560340083615:web:5305ad84ca2494dd0cd3aa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);