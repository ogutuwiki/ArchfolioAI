// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "archfolio-ai-7jr18",
  "appId": "1:712708627805:web:0524db8a53c444b5519cb4",
  "storageBucket": "archfolio-ai-7jr18.appspot.com",
  "apiKey": "AIzaSyAOtVp8S1y1nNOPqhFUD7EFhX5WggGKq4U",
  "authDomain": "archfolio-ai-7jr18.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "712708627805"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);