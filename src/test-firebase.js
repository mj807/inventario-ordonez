// Script de ejemplo para probar Firebase
// Abre la consola del navegador (F12) y pega este código

import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

// Datos de prueba
const testProducts = [
  {
    id: "test-1",
    type: "Brazuelo",
    weight: 15.5,
    date: "2025-11-06",
    location: "Cooler Principal",
    status: "in_cooler",
    history: [{ at: new Date().toISOString(), action: "created" }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "test-2",
    type: "T-Bone",
    weight: 12.0,
    date: "2025-11-06",
    location: "Cooler Principal",
    status: "in_cooler",
    history: [{ at: new Date().toISOString(), action: "created" }],
    createdAt: new Date().toISOString(),
  },
];

// Función para agregar productos de prueba
async function addTestProducts() {
  for (const product of testProducts) {
    try {
      await addDoc(collection(db, "inventory"), product);
      console.log("✅ Producto agregado:", product.type);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
}

// Descomentar para ejecutar:
// addTestProducts();
