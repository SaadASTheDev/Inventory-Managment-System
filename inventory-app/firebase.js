// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAENbw0PXsFcFY1za01Ks46cNuc7SJ8kqg",
  authDomain: "inventory-management-app-60085.firebaseapp.com",
  projectId: "inventory-management-app-60085",
  storageBucket: "inventory-management-app-60085.appspot.com",
  messagingSenderId: "852243423357",
  appId: "1:852243423357:web:20860105df6b38edbfd114",
  measurementId: "G-CHC0REPKNK"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
