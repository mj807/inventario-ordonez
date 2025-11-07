# 🔥 PASOS RÁPIDOS PARA SINCRONIZAR ENTRE DISPOSITIVOS

## ⚡ Configuración en 5 minutos

### 1️⃣ Ir a Firebase Console

👉 https://console.firebase.google.com/

### 2️⃣ Crear proyecto

- Clic en "Agregar proyecto"
- Nombre: `inventario-ordonez`
- Clic en "Crear proyecto"

### 3️⃣ Agregar app web

- Clic en el ícono **</>** (Web)
- Nombre: "Inventario Web"
- Clic en "Registrar app"
- **COPIAR** el objeto `firebaseConfig`

### 4️⃣ Activar Firestore

- Menú lateral: **Build** → **Firestore Database**
- Clic en "Create database"
- Seleccionar "Start in production mode"
- Ubicación: `us-east1`
- Clic en "Enable"

### 5️⃣ Configurar reglas de seguridad

- En Firestore, pestaña **Rules**
- Pegar este código:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inventory/{document=**} {
      allow read, write: if true;
    }
  }
}
```

- Clic en **Publish**

### 6️⃣ Actualizar archivo firebase.js

Abrir `src/firebase.js` y reemplazar con tus datos:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123",
};
```

### 7️⃣ ¡Listo! 🎉

Ahora puedes:

- ✅ Agregar productos en la computadora
- ✅ Ver los mismos productos en el teléfono
- ✅ Todo se sincroniza automáticamente en tiempo real

---

## 📱 Para acceder desde el teléfono:

1. Computadora y teléfono deben estar en la **misma red WiFi**
2. En la computadora, obtén tu IP local:
   - Windows: `ipconfig` (buscar IPv4)
   - Mac/Linux: `ifconfig` (buscar inet)
3. En el teléfono, abre el navegador y ve a:
   ```
   http://TU_IP:5173
   ```
   Por ejemplo: `http://192.168.1.100:5173`

---

## 🆘 Si algo no funciona:

1. Abre la consola del navegador (F12)
2. Revisa si hay errores en rojo
3. Verifica que hayas copiado bien los datos de `firebaseConfig`
4. Asegúrate de que las reglas de Firestore estén publicadas

---

## 💡 Ventajas:

- 🔄 Sincronización instantánea entre todos los dispositivos
- 📡 Funciona sin internet (datos se guardan localmente)
- 💾 Cuando vuelva internet, se sincroniza automáticamente
- 🆓 Completamente gratis (hasta 50,000 lecturas por día)
