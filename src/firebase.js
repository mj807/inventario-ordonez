import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase
// IMPORTANTE: Necesitas crear un proyecto en https://console.firebase.google.com/
// y reemplazar estos valores con los de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyD8pNdkXd1RONtNzP0mDCTDt3rKX2tH5pM",
  authDomain: "inventario-ordonez.firebaseapp.com",
  projectId: "inventario-ordonez",
  storageBucket: "inventario-ordonez.firebasestorage.app",
  messagingSenderId: "202459017877",
  appId: "1:202459017877:web:196fd25f7ba051475fa19c",
  measurementId: "G-S539XXHNTD",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);
