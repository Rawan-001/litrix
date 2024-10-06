import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCi1hfLNfJNCx-9258qfLULWYwcfO2btLg",
  authDomain: "litrix-698fe.firebaseapp.com",
  projectId: "litrix-698fe",
  storageBucket: "litrix-698fe.appspot.com",
  messagingSenderId: "758502263066",
  appId: "1:758502263066:web:f2090c6dbe72c02ee244a3",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);  

export { auth, db };




