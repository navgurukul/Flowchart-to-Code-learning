// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY", // Replace with your API key
//   authDomain: "YOUR_AUTH_DOMAIN", // Replace with your auth domain (e.g., project-id.firebaseapp.com)
//   projectId: "YOUR_PROJECT_ID", // Replace with your project ID
//   storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your storage bucket (e.g., project-id.appspot.com)
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your messaging sender ID
//   appId: "YOUR_APP_ID", // Replace with your app ID
//   measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your measurement ID
// };
const firebaseConfig = {
  apiKey: "AIzaSyD9z-BhcqiZcGHNiUZs9vMVpSbhwy05Q7E",
  authDomain: "flowchart-to-code-learning.firebaseapp.com",
  projectId: "flowchart-to-code-learning",
  storageBucket: "flowchart-to-code-learning.firebasestorage.app",
  messagingSenderId: "866932681402",
  appId: "1:866932681402:web:9230638822bbb560657083",
  measurementId: "G-451LJX49FH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { app, auth };
