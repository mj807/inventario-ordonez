# Configuración de Firebase para Sincronización en Tiempo Real

## Pasos para configurar Firebase:

### 1. Crear un proyecto en Firebase

1. Ve a https://console.firebase.google.com/
2. Haz clic en "Agregar proyecto" o "Add project"
3. Dale un nombre (por ejemplo: "inventario-ordonez")
4. Puedes desactivar Google Analytics si no lo necesitas
5. Haz clic en "Crear proyecto"

### 2. Obtener las credenciales de configuración

1. En la página principal de tu proyecto, haz clic en el ícono **Web** (</>) para agregar una aplicación web
2. Dale un nombre a tu app (por ejemplo: "Inventario Web")
3. NO marques "Firebase Hosting" por ahora
4. Haz clic en "Registrar app"
5. Copia el objeto `firebaseConfig` que te muestra

### 3. Configurar Firestore Database

1. En el menú lateral, ve a **"Build"** → **"Firestore Database"**
2. Haz clic en **"Create database"**
3. Selecciona **"Start in production mode"** (lo configuraremos después)
4. Elige una ubicación cercana (por ejemplo: `us-east1` para Norteamérica)
5. Haz clic en "Enable"

### 4. Configurar las reglas de seguridad

1. En Firestore Database, ve a la pestaña **"Rules"**
2. Reemplaza las reglas con el siguiente código:

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

**IMPORTANTE:** Estas reglas permiten acceso completo. Para producción, deberías implementar autenticación adecuada.

3. Haz clic en **"Publish"**

### 5. Actualizar el archivo firebase.js

1. Abre el archivo `src/firebase.js`
2. Reemplaza los valores de `firebaseConfig` con los que copiaste en el paso 2:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "inventario-ordonez.firebaseapp.com",
  projectId: "inventario-ordonez",
  storageBucket: "inventario-ordonez.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

### 6. Probar la aplicación

1. Guarda el archivo
2. La aplicación se recargará automáticamente
3. Intenta agregar un producto desde tu computadora
4. Abre la aplicación en tu teléfono (en la misma red local: http://TU_IP:5173)
5. Deberías ver el mismo producto en ambos dispositivos

## Migrar datos existentes de localStorage a Firebase

Si ya tienes datos en localStorage, puedes migrarlos manualmente:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" → "Local Storage"
3. Copia los datos del item "inventory"
4. Usa la consola de Firebase para importarlos, o crea los productos nuevamente

## Notas importantes:

- **Sincronización en tiempo real**: Los cambios se reflejan instantáneamente en todos los dispositivos
- **Funciona sin conexión**: Firebase tiene caché offline automático
- **Plan gratuito**: Firebase ofrece 1GB de almacenamiento y 50K lecturas/día gratis
- **Seguridad**: Para producción, implementa reglas de seguridad más estrictas

## Verificar que funciona:

1. Abre la aplicación en la computadora
2. Agrega un producto
3. Abre la aplicación en el teléfono
4. ✅ Deberías ver el producto instantáneamente

Si tienes problemas, revisa la consola del navegador (F12) para ver errores.
