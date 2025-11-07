import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCode from "qrcode";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import Login from "./components/Login";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query as firestoreQuery,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

// Textos
const texts = {
  en: {
    title: "Ordoñez Butcher Shop Inventory",
    loginTitle: "Administrator Login",
    username: "Username",
    password: "Password",
    login: "Login",
    logout: "Logout",
    addItem: "Add Item",
    meatType: "Meat Type",
    weight: "Weight (lb)",
    date: "Date",
    location: "Location",
    batchNumber: "Batch Number",
    currentBatch: "Current Batch",
    startNewBatch: "Start New Batch",
    addToBatch: "Add to Batch",
    batchItems: "Items in this batch",
    confirmBatch: "Finish Batch",
    batchFinished: "Batch finished successfully!",
    loadingProducts: "Loading products...",
    totalWeight: "Total Weight",
    save: "Save",
    noData: "No items in inventory yet.",
    enter: "Enter",
    scanPlaceholder: "Scan or type piece ID",
    assign: "Assign",
    assignTo: "Assign to store…",
    print: "Print",
    receive: "Receive",
    reception: "Store Reception",
    back: "Back",
    openCamera: "Open camera",
    closeCamera: "Close camera",
    scanQR: "Scan QR",
    deliveryTitle: "Facility Arrival",
    deliveryDesc:
      "Enter the product code registered at plant to mark its arrival at the facility.",
    deliveryButton: "Mark Delivery",
    coolerIntakeTitle: "Cooler Intake",
    coolerIntakeDesc:
      "Scan the product from Helen and enter the actual weight received at the cooler.",
    coolerIntakeButton: "Confirm Intake",
    plantWeight: "Plant Weight (Helen)",
    coolerWeight: "Actual Cooler Weight",
    productInfo: "Product Information",
    notifyRoberto: "📱 Notify Roberto (Arrival at 501)",
    notifyRobertoDesc: "Send WhatsApp message to Roberto",
    whatsappSent: "✅ WhatsApp message sent!",
    // Menu buttons
    inventoryEntry: "Inventory Entry",
    inventoryEntryDesc: "Add new products",
    facilityArrival: "Facility Arrival",
    facilityArrivalDesc: "Mark arrival at facility",
    coolerIntake: "Cooler Intake",
    coolerIntakeDesc2: "Confirm physical intake",
    dispatchAssign: "Dispatch Assign",
    dispatchAssignDesc: "Assign products to stores",
    storeReception: "Store Reception",
    storeReceptionDesc: "Confirm product reception",
    viewInventory: "View Inventory",
    viewInventoryDesc: "Review all products",
  },
  es: {
    title: "Inventario Ordoñez Butcher Shop",
    loginTitle: "Ingreso de Administrador",
    username: "Usuario",
    password: "Contraseña",
    login: "Ingresar",
    logout: "Cerrar sesión",
    addItem: "Agregar Producto",
    meatType: "Tipo de Carne",
    weight: "Peso (lb)",
    date: "Fecha",
    location: "Ubicación",
    batchNumber: "Número de Lote",
    currentBatch: "Lote Actual",
    startNewBatch: "Iniciar Nuevo Lote",
    addToBatch: "Agregar al Lote",
    batchItems: "Productos en este lote",
    confirmBatch: "Finalizar Lote",
    batchFinished: "¡Lote finalizado exitosamente!",
    loadingProducts: "Cargando productos...",
    totalWeight: "Peso Total",
    save: "Guardar",
    noData: "No hay productos en el inventario.",
    enter: "Entrar",
    scanPlaceholder: "Escanea o escribe el ID",
    assign: "Asignar",
    assignTo: "Asignar a tienda…",
    print: "Imprimir",
    receive: "Recibir",
    reception: "Recepción en Tienda",
    back: "Volver",
    openCamera: "Abrir cámara",
    closeCamera: "Cerrar cámara",
    scanQR: "Escanear QR",
    deliveryTitle: "Descarga / Llegada",
    deliveryDesc:
      "Ingresa el código del producto registrado en planta para marcar su llegada a la facility.",
    deliveryButton: "Marcar Descarga",
    coolerIntakeTitle: "Ingreso a Cooler",
    coolerIntakeDesc:
      "Escanea el producto de Helen e ingresa el peso real recibido en el cooler.",
    coolerIntakeButton: "Confirmar Ingreso",
    plantWeight: "Peso Planta (Helen)",
    coolerWeight: "Peso Real en Cooler",
    productInfo: "Información del Producto",
    notifyRoberto: "📱 Avisar a Roberto (Llegada a 501)",
    notifyRobertoDesc: "Enviar mensaje de WhatsApp a Roberto",
    whatsappSent: "✅ ¡Mensaje de WhatsApp enviado!",
    // Menu buttons
    inventoryEntry: "Ingreso de Inventario",
    inventoryEntryDesc: "Agregar nuevos productos",
    facilityArrival: "Descarga en 501",
    facilityArrivalDesc: "Marcar llegada a 501",
    coolerIntake: "Ingreso a Cooler",
    coolerIntakeDesc2: "Confirmar ingreso físico",
    dispatchAssign: "Asignación",
    dispatchAssignDesc: "Asignar productos a tiendas",
    storeReception: "Recepción en Tienda",
    storeReceptionDesc: "Confirmar recepción de productos",
    viewInventory: "Ver Inventario",
    viewInventoryDesc: "Revisar todos los productos",
  },
};

// Configuración
const ADMIN_USER = "admin";
const ADMIN_PASS = "morchione";

// Simple role credentials (temporary, can be moved to Firebase Auth custom claims)
// Users: username -> { pass, role, name }
const CREDENTIALS = {
  [ADMIN_USER]: { pass: ADMIN_PASS, role: "admin", name: "Administrador" },
  helen: { pass: "1234", role: "plant", name: "Helen" }, // Planta (recoge en planta)
  central: { pass: "1234", role: "cooler", name: "Central 501" }, // Recibe en 501 y mete a cooler
  distribucion: { pass: "1234", role: "dispatch", name: "Distribución" }, // Asigna a carnicerías
  tienda: { pass: "1234", role: "store", name: "Carnicería" }, // Recibe en carnicería
};
const STORAGE_KEY = "inventory";

const MEAT_TYPES_ES = [
  "Brazuelo",
  "Pierna",
  "T-Bone",
  "Rib Eye",
  "Cabeza",
  "Hígado",
  "Cola",
  "Lengua",
  "Corazón",
  "HangSteak",
  "Cerdo - Parte 1",
  "Cerdo - Parte 2",
];

const MEAT_TYPES_EN = [
  "Shank",
  "Leg",
  "T-Bone",
  "Rib Eye",
  "Head",
  "Liver",
  "Tail",
  "Tongue",
  "Heart",
  "HangSteak",
  "Pork - Part 1",
  "Pork - Part 2",
];

// Número de WhatsApp de Roberto (Central 501)
const ROBERTO_WHATSAPP = "15198189446";

const COOLER = {
  id: "cooler-1",
  name: "Cooler Principal",
  address: "501 Mersea Rd 5",
};

const STORES = [
  { id: "store-main", name: "Carnicería Principal", address: "128 Erie St S" },
  { id: "store-1", name: "Sucursal 1", address: "10 Mill St W" },
  { id: "store-2", name: "Sucursal 2", address: "22 Talbot St W" },
];

// Helpers
const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const buildQRPayload = (item) =>
  JSON.stringify({
    id: item.id,
    type: item.type,
    weight_lb: item.weight,
    date: item.date,
    from: COOLER.address,
  });

export default function App() {
  const [language, setLanguage] = useState("en");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("admin"); // admin|plant|cooler|dispatch|store
  const [currentScreen, setCurrentScreen] = useState("menu"); // menu, ingreso, descarga, coolerIntake, retiro, recepcion, inventario, coolerDetail, productDetail

  // Aseguramos que el root tenga altura completa
  useEffect(() => {
    // Removemos estilos que bloqueaban el scroll
  }, []);
  const [form, setForm] = useState({
    type: "",
    weight: "",
    date: "",
    location: COOLER.name,
  });
  const [currentBatch, setCurrentBatch] = useState(""); // Número de lote actual
  const [batchItems, setBatchItems] = useState([]); // Items del lote actual (solo IDs)
  const [finishedBatches, setFinishedBatches] = useState([]); // Lotes finalizados pendientes de enviar
  const [inventory, setInventory] = useState([]);
  const [qrItem, setQrItem] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [scanCode, setScanCode] = useState("");
  // Nuevos códigos para etapas intermedias
  const [deliverCode, setDeliverCode] = useState(""); // para marcar llegada a 501 (descarga)
  const [deliverCameraOn, setDeliverCameraOn] = useState(false); // Cámara para descarga
  const [coolerIntakeCode, setCoolerIntakeCode] = useState(""); // para confirmar ingreso al cooler
  const [coolerIntakeCameraOn, setCoolerIntakeCameraOn] = useState(false); // Cámara para cooler intake
  const [coolerIntakeWeight, setCoolerIntakeWeight] = useState(""); // Peso real en el cooler
  const [targetStore, setTargetStore] = useState("");
  const [receiveCode, setReceiveCode] = useState(""); // Para la recepción
  const [receiveCameraOn, setReceiveCameraOn] = useState(false); // Cámara para recepción
  const [cameraOn, setCameraOn] = useState(false);
  const [query, setQuery] = useState("");
  const [inventoryView, setInventoryView] = useState("summary"); // summary, byDate, individual, assigned, cooler, reports
  const [reportPeriod, setReportPeriod] = useState("week"); // week, month
  const [reportWeekStart, setReportWeekStart] = useState(""); // Fecha inicio de semana
  const [reportMonth, setReportMonth] = useState(""); // Mes seleccionado
  const [selectedProductGroup, setSelectedProductGroup] = useState(null); // Producto seleccionado en cooler detail
  const [selectedBatchForDiff, setSelectedBatchForDiff] = useState(null); // Lote seleccionado en vista de diferencias

  // Traducciones
  const t = texts[language];

  // Cargar datos iniciales desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("📂 localStorage al iniciar:", stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("✅ Cargados", parsed.length, "items desde localStorage");
        setInventory(parsed);
      } catch (error) {
        console.error("Error al cargar localStorage:", error);
      }
    } else {
      console.log("⚠️ localStorage está vacío");
    }
  }, []);

  // Sincronización con Firebase en tiempo real
  useEffect(() => {
    let unsubscribe = null;
    let isFirebaseActive = false;

    console.log("🔥 Intentando conectar con Firebase...");

    try {
      const q = firestoreQuery(
        collection(db, "inventory"),
        orderBy("date", "desc")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          isFirebaseActive = true;
          console.log("🔥 Firebase conectado! Snapshot recibido");
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ ...doc.data(), firebaseId: doc.id });
          });

          console.log("📦 Firebase sync - Items count:", items.length);
          console.log("📦 Firebase sync - Items:", items);

          // Solo actualizar si Firebase realmente tiene datos o si está sincronizando
          if (
            items.length > 0 ||
            snapshot.metadata.hasPendingWrites === false
          ) {
            setInventory(items);
            // Guardar también en localStorage como respaldo
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            console.log("✅ Inventory actualizado con", items.length, "items");
          }
        },
        (error) => {
          console.error("Error al sincronizar con Firebase:", error);
          // Si falla Firebase, mantener los datos locales
          if (!isFirebaseActive) {
            console.log("Firebase no disponible, usando modo offline");
          }
        }
      );
    } catch (error) {
      console.error("Error al inicializar Firebase:", error);
      console.log("Usando solo localStorage (modo offline)");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [language]);

  // Guardar en localStorage cuando cambie el inventario (respaldo)
  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    }
  }, [inventory]);

  // Generar número de lote automático cuando se abre la pantalla de ingreso
  useEffect(() => {
    if (currentScreen === "ingreso" && userRole === "plant" && !currentBatch) {
      // Generar número de lote: YYYYMMDD-001
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

      // Buscar si ya hay lotes de hoy
      const todayBatches = inventory.filter(
        (item) => item.batchNumber && item.batchNumber.startsWith(dateStr)
      );

      // Obtener el siguiente número
      let maxNum = 0;
      todayBatches.forEach((item) => {
        const parts = item.batchNumber.split("-");
        if (parts.length === 2) {
          const num = parseInt(parts[1]);
          if (num > maxNum) maxNum = num;
        }
      });

      const nextNum = (maxNum + 1).toString().padStart(3, "0");
      const newBatch = `${dateStr}-${nextNum}`;

      setCurrentBatch(newBatch);
      setBatchItems([]);

      toast.success(
        language === "es"
          ? `📦 Lote ${newBatch} iniciado`
          : `📦 Batch ${newBatch} started`
      );
    }
  }, [currentScreen, userRole, currentBatch, inventory, language]);

  // Calcular datos agrupados usando useMemo para mejor rendimiento
  const sortedGroups = useMemo(() => {
    console.log(
      "🔄 Recalculando sortedGroups con inventory length:",
      inventory.length
    );
    const groupedInventory = inventory.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {
          type: item.type,
          totalWeight: 0,
          items: [],
        };
      }
      acc[item.type].totalWeight += item.weight;
      acc[item.type].items.push(item);
      return acc;
    }, {});

    const result = Object.values(groupedInventory).sort((a, b) =>
      a.type.localeCompare(b.type)
    );
    console.log("📊 sortedGroups resultado:", result.length, "grupos");
    return result;
  }, [inventory]);

  const sortedByDate = useMemo(() => {
    console.log(
      "🔄 Recalculando sortedByDate con inventory length:",
      inventory.length
    );
    const byDateGroups = inventory.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {
          date: item.date,
          totalWeight: 0,
          items: [],
        };
      }
      acc[item.date].totalWeight += item.weight;
      acc[item.date].items.push(item);
      return acc;
    }, {});

    const result = Object.values(byDateGroups).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    console.log("📅 sortedByDate resultado:", result.length, "grupos");
    return result;
  }, [inventory]);

  // Inventarios asignados por carnicería
  const assignedByStore = useMemo(() => {
    console.log(
      "🔄 Recalculando assignedByStore con inventory length:",
      inventory.length
    );

    const assigned = inventory.filter((item) => item.status === "assigned");
    const byStore = assigned.reduce((acc, item) => {
      const storeName = item.assignedTo || "Sin asignar";
      if (!acc[storeName]) {
        acc[storeName] = {
          storeName,
          totalWeight: 0,
          items: [],
        };
      }
      acc[storeName].totalWeight += item.weight;
      acc[storeName].items.push(item);
      return acc;
    }, {});

    const result = Object.values(byStore).sort((a, b) =>
      a.storeName.localeCompare(b.storeName)
    );
    console.log("🏪 assignedByStore resultado:", result.length, "tiendas");
    return result;
  }, [inventory]);

  // Total en Cooler Principal
  const coolerInventory = useMemo(() => {
    console.log(
      "🔄 Recalculando coolerInventory con inventory length:",
      inventory.length
    );

    const inCooler = inventory.filter((item) => item.status === "in_cooler");

    // Agrupar por tipo
    const grouped = inCooler.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {
          type: item.type,
          totalWeight: 0,
          items: [],
        };
      }
      acc[item.type].totalWeight += item.weight;
      acc[item.type].items.push(item);
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) =>
      a.type.localeCompare(b.type)
    );

    const totalWeight = result.reduce(
      (sum, group) => sum + group.totalWeight,
      0
    );
    console.log(
      "🧊 coolerInventory resultado:",
      result.length,
      "productos, peso total:",
      totalWeight.toFixed(2),
      "lb"
    );

    return { groups: result, totalWeight };
  }, [inventory]);

  // Función para obtener el domingo de una semana
  const getSundayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Retroceder al domingo
    return new Date(d.setDate(diff));
  };

  // Función para formatear fecha YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Generar reporte por tienda
  const generateStoreReport = useMemo(() => {
    if (inventoryView !== "reports") return null;

    let filteredItems = [];

    if (reportPeriod === "week" && reportWeekStart) {
      const weekStart = new Date(reportWeekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      filteredItems = inventory.filter((item) => {
        if (item.status !== "assigned" && item.status !== "received")
          return false;
        const assignedDate = new Date(item.assignedAt || item.assignedDate);
        return assignedDate >= weekStart && assignedDate < weekEnd;
      });
    } else if (reportPeriod === "month" && reportMonth) {
      filteredItems = inventory.filter((item) => {
        if (item.status !== "assigned" && item.status !== "received")
          return false;
        const assignedDate = new Date(item.assignedAt || item.assignedDate);
        const itemMonth = `${assignedDate.getFullYear()}-${String(
          assignedDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return itemMonth === reportMonth;
      });
    }

    // Agrupar por tienda
    const byStore = filteredItems.reduce((acc, item) => {
      const store = item.assignedTo || "Sin asignar";
      if (!acc[store]) {
        acc[store] = {
          store: store,
          totalWeight: 0,
          items: [],
          productTypes: {},
        };
      }
      acc[store].totalWeight += item.weight;
      acc[store].items.push(item);

      // Agrupar por tipo de producto
      if (!acc[store].productTypes[item.type]) {
        acc[store].productTypes[item.type] = {
          type: item.type,
          weight: 0,
          count: 0,
        };
      }
      acc[store].productTypes[item.type].weight += item.weight;
      acc[store].productTypes[item.type].count++;

      return acc;
    }, {});

    return Object.values(byStore).sort((a, b) =>
      a.store.localeCompare(b.store)
    );
  }, [inventory, inventoryView, reportPeriod, reportWeekStart, reportMonth]);

  // Scanner QR (moved up so hooks run in same order every render)
  useEffect(() => {
    if (!cameraOn) return;
    let scanner;
    try {
      scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 12, // un poco más fluido
        // QRBOX dinámico: ocupa ~80% del menor lado del visor
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.8);
          return { width: size, height: size };
        },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true, // botón flash si existe
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: { ideal: "environment" }, // cámara trasera
          focusMode: "continuous", // enfoque continuo
          advanced: [{ torch: true }],
        },
        formatsToSupport: [0], // QR_CODE
        disableFlip: true,
      });

      scanner
        .render(
          (text) => {
            console.log("📷 QR escaneado:", text);
            try {
              const parsed = JSON.parse(text);
              setScanCode(parsed.id || text);
              console.log("✅ ID detectado:", parsed.id || text);
              setCameraOn(false); // Cerrar cámara automáticamente
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            } catch {
              setScanCode(text);
              console.log("✅ Código detectado:", text);
              setCameraOn(false); // Cerrar cámara automáticamente
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            }
          },
          (error) => {
            // Ignorar errores de escaneo (ruido normal)
            if (error && !error.includes("NotFoundException")) {
              console.warn("Scanner error:", error);
            }
          }
        )
        .catch(console.error);
    } catch (error) {
      console.error("Error initializing scanner:", error);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [cameraOn]);

  // Scanner QR para recepción en tienda
  useEffect(() => {
    if (!receiveCameraOn) return;
    let scanner;
    try {
      scanner = new Html5QrcodeScanner("qr-reader-receive", {
        fps: 12,
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.8);
          return { width: size, height: size };
        },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: { ideal: "environment" },
          focusMode: "continuous",
          advanced: [{ torch: true }],
        },
        formatsToSupport: [0],
        disableFlip: true,
      });

      scanner
        .render(
          (text) => {
            console.log("📷 QR recepción escaneado:", text);
            try {
              const parsed = JSON.parse(text);
              setReceiveCode(parsed.id || text);
              console.log("✅ ID detectado:", parsed.id || text);
              setReceiveCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            } catch {
              setReceiveCode(text);
              console.log("✅ Código detectado:", text);
              setReceiveCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            }
          },
          (error) => {
            if (error && !error.includes("NotFoundException")) {
              console.warn("Scanner error:", error);
            }
          }
        )
        .catch(console.error);
    } catch (error) {
      console.error("Error initializing receive scanner:", error);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [receiveCameraOn]);

  // Scanner QR para Descarga (deliverCode)
  useEffect(() => {
    if (!deliverCameraOn) return;
    let scanner;
    try {
      scanner = new Html5QrcodeScanner("qr-reader-deliver", {
        fps: 12,
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.8);
          return { width: size, height: size };
        },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: { ideal: "environment" },
          focusMode: "continuous",
          advanced: [{ torch: true }],
        },
        formatsToSupport: [0],
        disableFlip: true,
      });

      scanner
        .render(
          (text) => {
            console.log("📷 QR descarga escaneado:", text);
            try {
              const parsed = JSON.parse(text);
              setDeliverCode(parsed.id || text);
              console.log("✅ ID detectado:", parsed.id || text);
              setDeliverCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            } catch {
              setDeliverCode(text);
              console.log("✅ Código detectado:", text);
              setDeliverCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            }
          },
          (error) => {
            if (error && !error.includes("NotFoundException")) {
              console.warn("Scanner error:", error);
            }
          }
        )
        .catch(console.error);
    } catch (error) {
      console.error("Error initializing deliver scanner:", error);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [deliverCameraOn]);

  // Scanner QR para Cooler Intake (coolerIntakeCode)
  useEffect(() => {
    if (!coolerIntakeCameraOn) return;
    let scanner;
    try {
      scanner = new Html5QrcodeScanner("qr-reader-cooler-intake", {
        fps: 12,
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.8);
          return { width: size, height: size };
        },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: { ideal: "environment" },
          focusMode: "continuous",
          advanced: [{ torch: true }],
        },
        formatsToSupport: [0],
        disableFlip: true,
      });

      scanner
        .render(
          (text) => {
            console.log("📷 QR cooler intake escaneado:", text);
            try {
              const parsed = JSON.parse(text);
              setCoolerIntakeCode(parsed.id || text);
              console.log("✅ ID detectado:", parsed.id || text);
              setCoolerIntakeCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            } catch {
              setCoolerIntakeCode(text);
              console.log("✅ Código detectado:", text);
              setCoolerIntakeCameraOn(false);
              setTimeout(() => scanner.clear().catch(() => {}), 100);
            }
          },
          (error) => {
            if (error && !error.includes("NotFoundException")) {
              console.warn("Scanner error:", error);
            }
          }
        )
        .catch(console.error);
    } catch (error) {
      console.error("Error initializing cooler intake scanner:", error);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [coolerIntakeCameraOn]);

  // Filtrado de inventario (moved up for stable hook order)
  const filtered = useMemo(
    () =>
      inventory.filter((i) =>
        `${i.type} ${i.id}`.toLowerCase().includes(query.toLowerCase())
      ),
    [inventory, query]
  );

  // Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    const user = e.target.user.value;
    const pass = e.target.pass.value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setLoggedIn(true);
      toast.success("✅ Login successful!");
    } else {
      toast.error("❌ Invalid credentials!");
    }
  };

  // Descargar etiqueta como PNG (QR + texto)
  const downloadLabelPng = async () => {
    try {
      if (!qrItem || !qrDataUrl) return;
      const canvas = document.createElement("canvas");
      // Tamaño base 640x320 px (proporción 2:1 similar a 64x32mm)
      const W = 640,
        H = 320;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      // Fondo blanco
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      // Cargar imagen QR
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = qrDataUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      // Margen
      const pad = 20;
      const qrSize = H - pad * 2; // cuadrado
      ctx.drawImage(img, pad, pad, qrSize, qrSize);
      // Texto a la derecha
      const x = pad + qrSize + 20;
      let y = pad + 10;
      ctx.fillStyle = "#000";
      ctx.font = "bold 22px system-ui, Arial";
      ctx.fillText(qrItem.id || "", x, y);
      y += 34;
      ctx.font = "18px system-ui, Arial";
      ctx.fillText(`${qrItem.type || ""} — ${qrItem.weight || ""} lb`, x, y);
      y += 28;
      ctx.fillText(`${qrItem.date || ""}`, x, y);
      y += 28;
      ctx.fillText(`${COOLER.name}`, x, y);

      // Descargar
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `label-${qrItem.id || "qr"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Error generating PNG label:", e);
      toast.error(
        language === "es"
          ? "No se pudo generar la imagen"
          : "Failed to generate image"
      );
    }
  };

  const handleLogout = () => setLoggedIn(false);

  const handleLoginAttempt = (user, pass) => {
    const cred = CREDENTIALS[user];
    if (!cred || cred.pass !== pass) {
      toast.error(
        language === "es"
          ? "❌ Credenciales inválidas"
          : "❌ Invalid credentials"
      );
      return;
    }
    setLoggedIn(true);
    setUserRole(cred.role);
    toast.success(
      language === "es"
        ? `✅ Bienvenido ${cred.name} (${cred.role})`
        : `✅ Welcome ${cred.name} (${cred.role})`
    );
  };

  // Vista de Login
  if (!loggedIn) {
    return (
      <>
        <Login
          onLogin={handleLoginAttempt}
          language={language}
          setLanguage={setLanguage}
          texts={texts}
        />
        <ToastContainer position="top-center" />
      </>
    );
  }

  // Handlers de la aplicación principal
  // Stage 1: Helen registra producto en planta (status: plant_received)
  const addItem = async (e) => {
    e.preventDefault();
    if (!form.type || !form.weight || !form.date) {
      toast.warning(
        "⚠️ " +
          (language === "es"
            ? "Completa tipo, peso y fecha"
            : "Please fill type, weight and date")
      );
      return;
    }

    if (!currentBatch) {
      toast.warning(
        "⚠️ " +
          (language === "es"
            ? "Debes iniciar un lote primero"
            : "You must start a batch first")
      );
      return;
    }

    if (userRole !== "plant" && userRole !== "admin") {
      toast.error(
        language === "es"
          ? "Solo el rol Planta puede crear productos iniciales"
          : "Only Plant role can create initial products"
      );
      return;
    }

    const item = {
      id: uid(),
      type: form.type,
      weight: Number(form.weight),
      date: form.date,
      location: COOLER.name,
      batchNumber: currentBatch, // Agregar número de lote
      status: "plant_received", // primera etapa
      history: [
        {
          at: new Date().toISOString(),
          action: "plant_received",
          by: userRole,
          batch: currentBatch,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Agregar al inventario local inmediatamente para feedback instantáneo
    setInventory((prev) => [item, ...prev]);

    // Agregar al lote actual
    setBatchItems((prev) => [...prev, item.id]);

    try {
      // Intentar guardar en Firebase
      const docRef = await addDoc(collection(db, "inventory"), item);
      item.firebaseId = docRef.id;
      // Actualizar el item con el firebaseId
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, firebaseId: docRef.id } : i
        )
      );
    } catch (error) {
      console.error(
        "Error al guardar en Firebase (usando modo offline):",
        error
      );
      // Ya está guardado localmente, solo continuamos
    }

    const qrText = buildQRPayload(item);
    const dataUrl = await QRCode.toDataURL(qrText, { margin: 0, scale: 8 });

    setForm({ type: "", weight: "", date: "", location: COOLER.name });

    // Mostrar el QR inmediatamente
    setQrItem(item);
    setQrDataUrl(dataUrl);

    toast.success(language === "es" ? "✅ Guardado" : "✅ Saved successfully!");
  };

  const showQR = async (it) => {
    const dataUrl = await QRCode.toDataURL(buildQRPayload(it), {
      margin: 0,
      scale: 8,
    });
    setQrItem(it);
    setQrDataUrl(dataUrl);
  };

  const printLabel = () => {
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset='utf-8' />
        <title>Etiqueta ${qrItem?.id || ""}</title>
        <style>
          *{box-sizing:border-box;font-family:system-ui,Arial}
          @page { size: 72mm 36mm; margin: 0 }
          body{margin:0;display:grid;place-items:center;background:#fff}
          .label{width:64mm;height:32mm;padding:3.5mm;display:flex;gap:6px;align-items:center}
          img{width:28mm;height:28mm}
          .txt{font-size:12px;line-height:1.2}
          .id{font-weight:700;font-size:12px}
        </style>
      </head>
      <body>
        <div class='label'>
          <img id='qrimg' src='${qrDataUrl}'/>
          <div class='txt'>
            <div class='id'>${qrItem?.id || ""}</div>
            <div>${qrItem?.type || ""} — ${qrItem?.weight || ""} lb</div>
            <div>${qrItem?.date || ""}</div>
            <div>${COOLER.name}</div>
          </div>
        </div>
        <script>
          (function(){
            function go(){
              try{window.focus();}catch(e){}
              setTimeout(function(){ window.print(); }, 100);
            }
            var img = document.getElementById('qrimg');
            if(img.complete) go(); else img.onload = go;
          })();
        </script>
      </body>
    </html>`;

    // Intento 1: nueva ventana (si el navegador lo permite)
    const w = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=800,height=600"
    );
    if (w && w.document) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return;
    }

    // Intento 2 (fallback): usar un iframe oculto para imprimir sin popup
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    // Remover el iframe unos segundos después
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {}
    }, 5000);
  };

  const assignToStore = async () => {
    if (!scanCode || !targetStore)
      return toast.warning(
        language === "es"
          ? "Escanea/ingresa código y elige tienda"
          : "Scan/type code and choose store"
      );

    if (userRole !== "dispatch" && userRole !== "admin") {
      return toast.error(
        language === "es"
          ? "Tu rol no puede asignar productos"
          : "Your role cannot assign products"
      );
    }

    const itemIndex = inventory.findIndex((i) => i.id === scanCode);
    if (itemIndex === -1)
      return toast.error(
        language === "es" ? "Código no encontrado" : "Code not found"
      );

    const item = inventory[itemIndex];

    // Validaciones de estado: solo se puede asignar si está en el cooler
    if (item.status === "assigned") {
      return toast.error(
        language === "es"
          ? `Este producto ya fue asignado a ${item.assignedTo}`
          : `This product is already assigned to ${item.assignedTo}`
      );
    }
    if (item.status === "received") {
      return toast.error(
        language === "es"
          ? "Este producto ya fue recibido en tienda y no puede usarse de nuevo"
          : "This product has already been received at the store and cannot be reused"
      );
    }

    const updatedData = {
      status: "assigned",
      assignedTo: targetStore,
      assignedAt: new Date().toISOString(),
      history: [
        ...(item.history || []),
        { at: new Date().toISOString(), action: "assigned", to: targetStore },
      ],
    };

    try {
      // Intentar actualizar en Firebase
      if (item.firebaseId) {
        const itemRef = doc(db, "inventory", item.firebaseId);
        await updateDoc(itemRef, updatedData);
      } else {
        // Si no hay firebaseId, actualizar solo localmente
        const updatedInventory = [...inventory];
        updatedInventory[itemIndex] = { ...item, ...updatedData };
        setInventory(updatedInventory);
      }

      setScanCode("");
      setTargetStore("");
      toast.success(language === "es" ? "Asignado" : "Assigned");
    } catch (error) {
      console.error("Error al asignar en Firebase:", error);
      // Si falla Firebase, actualizar localmente
      const updatedInventory = [...inventory];
      updatedInventory[itemIndex] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setScanCode("");
      setTargetStore("");
      toast.success(
        language === "es" ? "Asignado (offline)" : "Assigned (offline)"
      );
    }
  };

  // Función para recibir productos en la tienda
  const receiveInStore = async () => {
    if (!receiveCode)
      return toast.warning(
        language === "es"
          ? "Escanea o ingresa el código del producto"
          : "Scan or type product code"
      );

    if (userRole !== "store" && userRole !== "admin") {
      return toast.error(
        language === "es"
          ? "Solo rol Tienda puede recibir"
          : "Only Store role can receive"
      );
    }

    const itemIndex = inventory.findIndex((i) => i.id === receiveCode);
    if (itemIndex === -1)
      return toast.error(
        language === "es" ? "Código no encontrado" : "Code not found"
      );

    const item = inventory[itemIndex];

    // Validar estado actual: debe estar asignado y no recibido
    if (item.status === "received")
      return toast.error(
        language === "es"
          ? "Este producto ya fue recibido anteriormente"
          : "This product has already been received"
      );

    if (item.status !== "assigned")
      return toast.error(
        language === "es"
          ? "Este producto no está asignado a ninguna tienda"
          : "This product is not assigned to any store"
      );

    const updatedData = {
      status: "received",
      receivedAt: new Date().toISOString(),
      history: [
        ...(item.history || []),
        {
          at: new Date().toISOString(),
          action: "received",
          at_store: item.assignedTo,
        },
      ],
    };

    try {
      // Intentar actualizar en Firebase
      if (item.firebaseId) {
        const itemRef = doc(db, "inventory", item.firebaseId);
        await updateDoc(itemRef, updatedData);
      } else {
        // Si no hay firebaseId, actualizar solo localmente
        const updatedInventory = [...inventory];
        updatedInventory[itemIndex] = { ...item, ...updatedData };
        setInventory(updatedInventory);
      }

      setReceiveCode("");
      toast.success(
        language === "es"
          ? `✅ Recibido en ${item.assignedTo}`
          : `✅ Received at ${item.assignedTo}`
      );
    } catch (error) {
      console.error("Error al recibir en Firebase:", error);
      // Si falla Firebase, actualizar localmente
      const updatedInventory = [...inventory];
      updatedInventory[itemIndex] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setReceiveCode("");
      toast.success(
        language === "es"
          ? `✅ Recibido en ${item.assignedTo} (offline)`
          : `✅ Received at ${item.assignedTo} (offline)`
      );
    }
  };

  // Etapa intermedia: Marcar producto como "entregado en facility" (descarga)
  const deliverToFacility = async () => {
    if (!deliverCode) {
      return toast.warning(
        language === "es"
          ? "Ingresa o escanea el código del producto"
          : "Enter or scan product code"
      );
    }

    if (userRole !== "plant" && userRole !== "admin") {
      return toast.error(
        language === "es"
          ? "Solo rol Planta puede marcar descarga"
          : "Only Plant role can mark delivery"
      );
    }

    const idx = inventory.findIndex((i) => i.id === deliverCode);
    if (idx === -1)
      return toast.error(
        language === "es" ? "Código no encontrado" : "Code not found"
      );
    const item = inventory[idx];

    if (item.status !== "plant_received") {
      return toast.error(
        language === "es"
          ? "El producto no está en estado inicial (plant_received)"
          : "Item not in initial state (plant_received)"
      );
    }

    const updatedData = {
      status: "delivered_to_facility",
      deliveredAt: new Date().toISOString(),
      history: [
        ...(item.history || []),
        {
          at: new Date().toISOString(),
          action: "delivered_to_facility",
          by: userRole,
        },
      ],
    };

    try {
      if (item.firebaseId) {
        const refItem = doc(db, "inventory", item.firebaseId);
        await updateDoc(refItem, updatedData);
      }
      const updatedInventory = [...inventory];
      updatedInventory[idx] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setDeliverCode("");
      toast.success(
        language === "es" ? "🚚 Descarga marcada" : "🚚 Delivery marked"
      );
    } catch (e) {
      console.error("Error marking delivery:", e);
      const updatedInventory = [...inventory];
      updatedInventory[idx] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setDeliverCode("");
      toast.success(
        language === "es"
          ? "🚚 Descarga marcada (offline)"
          : "🚚 Delivery marked (offline)"
      );
    }
  };

  // Etapa intermedia: Confirmar ingreso físico al cooler
  const intakeToCooler = async () => {
    if (!coolerIntakeCode) {
      return toast.warning(
        language === "es"
          ? "Ingresa o escanea el código del producto"
          : "Enter or scan product code"
      );
    }

    if (!coolerIntakeWeight || Number(coolerIntakeWeight) <= 0) {
      return toast.warning(
        language === "es"
          ? "Ingresa el peso real recibido en el cooler"
          : "Enter the actual weight received at the cooler"
      );
    }

    if (userRole !== "cooler" && userRole !== "admin") {
      return toast.error(
        language === "es"
          ? "Solo rol Cooler puede confirmar ingreso"
          : "Only Cooler role can confirm intake"
      );
    }

    const idx = inventory.findIndex((i) => i.id === coolerIntakeCode);
    if (idx === -1)
      return toast.error(
        language === "es" ? "Código no encontrado" : "Code not found"
      );
    const item = inventory[idx];

    if (item.status !== "delivered_to_facility") {
      return toast.error(
        language === "es"
          ? "El producto no está en estado 'delivered_to_facility'"
          : "Item not in 'delivered_to_facility' state"
      );
    }

    const updatedData = {
      status: "in_cooler",
      weight: Number(coolerIntakeWeight), // Actualizar con el peso del cooler
      plantWeight: item.weight, // Guardar el peso original de Helen
      coolerIntakeAt: new Date().toISOString(),
      history: [
        ...(item.history || []),
        {
          at: new Date().toISOString(),
          action: "in_cooler",
          by: userRole,
          plantWeight: item.weight,
          coolerWeight: Number(coolerIntakeWeight),
        },
      ],
    };

    try {
      if (item.firebaseId) {
        const refItem = doc(db, "inventory", item.firebaseId);
        await updateDoc(refItem, updatedData);
      }
      const updatedInventory = [...inventory];
      updatedInventory[idx] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setCoolerIntakeCode("");
      setCoolerIntakeWeight("");
      toast.success(
        language === "es" ? "🧊 Ingreso confirmado" : "🧊 Intake confirmed"
      );
    } catch (e) {
      console.error("Error confirming cooler intake:", e);
      const updatedInventory = [...inventory];
      updatedInventory[idx] = { ...item, ...updatedData };
      setInventory(updatedInventory);
      setCoolerIntakeCode("");
      setCoolerIntakeWeight("");
      toast.success(
        language === "es"
          ? "🧊 Ingreso confirmado (offline)"
          : "🧊 Intake confirmed (offline)"
      );
    }
  };

  // Scanner logic moved earlier to keep hook order stable

  // Renderizar pantalla de menú principal
  const renderMenu = () => (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#3b0d0d] via-[#2a0a0a] to-[#111827] text-white p-6">
      <ToastContainer position="top-center" />

      {/* Header */}
      <div className="flex w-full max-w-5xl mx-auto justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
          </select>
          <button
            onClick={handleLogout}
            className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {/* Botones del menú principal - estilo moderno compacto */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-6">
          {/* Ingreso de Inventario (Plant) */}
          {(userRole === "plant" || userRole === "admin") && (
            <button
              onClick={() => setCurrentScreen("ingreso")}
              className={`group relative bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20 ${
                finishedBatches.length === 0 ? "col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🥩</span>
                <span className="text-base font-bold">{t.inventoryEntry}</span>
              </div>
              <div className="text-xs text-white/80 mt-1 text-center">
                {t.inventoryEntryDesc}
              </div>
            </button>
          )}

          {/* Avisar a Roberto (Solo si hay lotes finalizados) */}
          {(userRole === "plant" || userRole === "admin") &&
            finishedBatches.length > 0 && (
              <button
                onClick={() => {
                  // Crear mensaje con todos los lotes finalizados
                  const batchesSummary = finishedBatches
                    .map((batch) => {
                      const productSummary = batch.items
                        .map(
                          (item, idx) =>
                            `${idx + 1}. ${item.type} - ${item.weight} lb`
                        )
                        .join("\n");

                      return `📦 *Lote: ${batch.batchNumber}*\n🥩 *Productos (${
                        batch.items.length
                      }):*\n${productSummary}\n⚖️ *Peso: ${batch.totalWeight.toFixed(
                        2
                      )} lb*`;
                    })
                    .join("\n\n");

                  const totalWeightAllBatches = finishedBatches.reduce(
                    (sum, batch) => sum + batch.totalWeight,
                    0
                  );

                  const message = encodeURIComponent(
                    language === "es"
                      ? `Hola Roberto, ya estoy en la 501 Mersea Rd 5 esperando a ser descargada.\n\n${batchesSummary}\n\n🔢 *Total de Lotes: ${
                          finishedBatches.length
                        }*\n⚖️ *Peso Total General: ${totalWeightAllBatches.toFixed(
                          2
                        )} lb*\n\n- Helen`
                      : `Hi Roberto, I'm at 501 Mersea Rd 5 waiting to be unloaded.\n\n${batchesSummary}\n\n🔢 *Total Batches: ${
                          finishedBatches.length
                        }*\n⚖️ *Total Weight: ${totalWeightAllBatches.toFixed(
                          2
                        )} lb*\n\n- Helen`
                  );

                  window.open(
                    `https://wa.me/${ROBERTO_WHATSAPP}?text=${message}`,
                    "_blank"
                  );

                  toast.success(t.whatsappSent);

                  // Limpiar lotes finalizados después de enviar
                  setFinishedBatches([]);
                }}
                className="group relative bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">📱</span>
                  <span className="text-base font-bold">{t.notifyRoberto}</span>
                </div>
                <div className="text-xs text-white/80 mt-1 text-center">
                  {finishedBatches.length}{" "}
                  {language === "es"
                    ? finishedBatches.length === 1
                      ? "lote listo"
                      : "lotes listos"
                    : finishedBatches.length === 1
                    ? "batch ready"
                    : "batches ready"}
                </div>
              </button>
            )}

          {/* Ingreso a Cooler (Cooler) */}
          {(userRole === "cooler" || userRole === "admin") && (
            <button
              onClick={() => setCurrentScreen("coolerIntake")}
              className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🧊</span>
                <span className="text-base font-bold">{t.coolerIntake}</span>
              </div>
              <div className="text-xs text-white/80 mt-1 text-center">
                {t.coolerIntakeDesc2}
              </div>
            </button>
          )}

          {/* Retiro / Asignación (Dispatch) */}
          {(userRole === "dispatch" || userRole === "admin") && (
            <button
              onClick={() => setCurrentScreen("retiro")}
              className="group relative bg-gradient-to-br from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🚚</span>
                <span className="text-base font-bold">{t.dispatchAssign}</span>
              </div>
              <div className="text-xs text-white/80 mt-1 text-center">
                {t.dispatchAssignDesc}
              </div>
            </button>
          )}

          {/* Recepción en Tienda (Store) */}
          {(userRole === "store" || userRole === "admin") && (
            <button
              onClick={() => setCurrentScreen("recepcion")}
              className="group relative bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🏪</span>
                <span className="text-base font-bold">{t.storeReception}</span>
              </div>
              <div className="text-xs text-white/80 mt-1 text-center">
                {t.storeReceptionDesc}
              </div>
            </button>
          )}

          {/* Ver Inventario (Solo cooler, dispatch, store, admin - NO plant) */}
          {(userRole === "cooler" ||
            userRole === "dispatch" ||
            userRole === "store" ||
            userRole === "admin") && (
            <button
              onClick={() => setCurrentScreen("inventario")}
              className="group relative bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-4 px-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20 col-span-2"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📊</span>
                <span className="text-base font-bold">{t.viewInventory}</span>
              </div>
              <div className="text-xs text-white/80 mt-1 text-center">
                {t.viewInventoryDesc}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar pantalla de ingreso
  const renderIngreso = () => (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white p-6">
      <ToastContainer position="top-center" />

      {/* Header */}
      <div className="flex w-full max-w-3xl justify-between items-center mb-6">
        <button
          onClick={() => setCurrentScreen("menu")}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          ← {language === "es" ? "Volver" : "Back"}
        </button>
        <h1 className="text-2xl font-bold">
          {language === "es" ? "Ingreso de Inventario" : "Inventory Entry"}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
        >
          {t.logout}
        </button>
      </div>

      {/* Formulario de ingreso */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 w-full max-w-3xl space-y-4">
        {/* Sistema de Lotes - Automático */}
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30 space-y-3">
          <h3 className="text-lg font-bold text-blue-300">{t.currentBatch}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-2xl text-green-400">
                  {currentBatch}
                </div>
                <div className="text-sm text-white/60">
                  {language === "es" ? t.loadingProducts : t.loadingProducts}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de productos cargados */}
        {batchItems.length > 0 && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30 space-y-3">
            <h3 className="text-lg font-bold text-green-300">
              {t.batchItems} ({batchItems.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {inventory
                .filter((item) => batchItems.includes(item.id))
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white/10 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">
                        {idx + 1}. {item.type}
                      </div>
                      <div className="text-sm text-white/60">{item.date}</div>
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {item.weight} lb
                    </div>
                  </div>
                ))}
            </div>
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t.totalWeight}:</span>
                <span className="text-2xl text-green-400">
                  {inventory
                    .filter((item) => batchItems.includes(item.id))
                    .reduce((sum, item) => sum + item.weight, 0)
                    .toFixed(2)}{" "}
                  lb
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para agregar productos */}
        {currentBatch && (
          <form onSubmit={addItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.meatType}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-black"
              >
                <option value="">
                  {language === "es" ? "Seleccionar tipo" : "Select type"}
                </option>
                {(language === "es" ? MEAT_TYPES_ES : MEAT_TYPES_EN).map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t.weight}
              </label>
              <input
                type="number"
                placeholder={t.weight}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-black"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.date}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t.location}
              </label>
              <input
                type="text"
                value={COOLER.name}
                disabled
                className="w-full px-4 py-3 rounded-lg text-black bg-gray-200"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 rounded-lg font-semibold py-3 text-lg"
            >
              {t.addToBatch}
            </button>
          </form>
        )}

        {/* Botón para finalizar lote (NO envía WhatsApp) */}
        {currentBatch && batchItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              // Guardar lote como finalizado
              const itemsInBatch = inventory.filter((item) =>
                batchItems.includes(item.id)
              );

              const batchData = {
                batchNumber: currentBatch,
                items: itemsInBatch,
                totalWeight: itemsInBatch.reduce(
                  (sum, item) => sum + item.weight,
                  0
                ),
                finishedAt: new Date().toISOString(),
              };

              setFinishedBatches((prev) => [...prev, batchData]);

              toast.success(t.batchFinished);

              // Limpiar lote actual para comenzar uno nuevo
              setCurrentBatch("");
              setBatchItems([]);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">✅</span>
            {t.confirmBatch}
          </button>
        )}
      </div>

      {/* Modal QR - Mostrar después de guardar */}
      {qrItem && currentScreen === "ingreso" && (
        <div
          className="fixed inset-0 bg-black/70 grid place-items-center z-50"
          onClick={() => {
            setQrItem(null);
            setCurrentScreen("inventario");
          }}
        >
          <div
            className="bg-white text-black rounded-2xl p-6 w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold text-lg mb-3">
              {language === "es" ? "Etiqueta para" : "Label for"}: {qrItem.type}{" "}
              — {qrItem.weight} lb
            </div>
            <img src={qrDataUrl} alt="qr" className="mx-auto mb-3 w-48 h-48" />
            <div className="text-sm mb-4">
              <strong>ID:</strong> {qrItem.id}
              <br />
              <strong>{language === "es" ? "Fecha" : "Date"}:</strong>{" "}
              {qrItem.date}
              <br />
              <strong>
                {language === "es" ? "Ubicación" : "Location"}:
              </strong>{" "}
              {COOLER.name} — {COOLER.address}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
                onClick={() => {
                  setQrItem(null);
                  setCurrentScreen("inventario");
                }}
              >
                {language === "es" ? "Ver Inventario" : "View Inventory"}
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                onClick={downloadLabelPng}
              >
                {language === "es" ? "Descargar PNG" : "Download PNG"}
              </button>
              <button
                className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={printLabel}
              >
                {t.print}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar pantalla de retiro
  const renderRetiro = () => (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white p-6">
      <ToastContainer position="top-center" />

      {/* Header */}
      <div className="flex w-full max-w-3xl justify-between items-center mb-6">
        <button
          onClick={() => setCurrentScreen("menu")}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          ← {language === "es" ? "Volver" : "Back"}
        </button>
        <h1 className="text-2xl font-bold">
          {language === "es" ? "Retiro de Inventario" : "Inventory Withdrawal"}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
        >
          {t.logout}
        </button>
      </div>

      {/* Formulario de retiro */}
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === "es"
              ? "Escanear QR o Ingresar ID"
              : "Scan QR or Enter ID"}
          </label>
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            placeholder={t.scanPlaceholder}
            className="w-full px-4 py-3 rounded-lg text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {language === "es" ? "Fecha" : "Date"}
          </label>
          <input
            type="date"
            value={new Date().toISOString().split("T")[0]}
            disabled
            className="w-full px-4 py-3 rounded-lg text-black bg-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.assignTo}</label>
          <select
            value={targetStore}
            onChange={(e) => setTargetStore(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-black"
          >
            <option value="">
              {language === "es" ? "Seleccionar tienda" : "Select store"}
            </option>
            <option value={`Carnicería Principal (128 Erie St S)`}>
              Carnicería Principal (128 Erie St S)
            </option>
            <option value={`Sucursal 1 (10 Mill St W)`}>
              Sucursal 1 (10 Mill St W)
            </option>
            <option value={`Sucursal 2 (22 Talbot St)`}>
              Sucursal 2 (22 Talbot St)
            </option>
          </select>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setCameraOn((v) => !v)}
            className="w-full px-4 py-3 rounded-lg bg-slate-600 hover:bg-slate-700 font-semibold"
          >
            {cameraOn
              ? language === "es"
                ? "Cerrar cámara"
                : "Close camera"
              : language === "es"
              ? "Abrir cámara"
              : "Open camera"}
          </button>

          {cameraOn && (
            <div className="mt-3 flex justify-end">
              <div className="w-full max-w-sm ml-auto" id="qr-reader"></div>
            </div>
          )}
        </div>

        <button
          onClick={assignToStore}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold py-3 text-lg"
        >
          {t.assign}
        </button>
      </div>
    </div>
  );

  // Renderizar pantalla de recepción en tienda
  const renderRecepcion = () => (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white p-6">
      <ToastContainer position="top-center" />

      {/* Header */}
      <div className="flex w-full max-w-3xl justify-between items-center mb-6">
        <button
          onClick={() => setCurrentScreen("menu")}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          ← {language === "es" ? "Volver" : "Back"}
        </button>
        <h1 className="text-2xl font-bold">{t.reception}</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
        >
          {t.logout}
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/20 backdrop-blur-md border border-orange-500/30 rounded-xl shadow-lg p-6 w-full max-w-3xl space-y-4">
        <p className="text-center text-white/80 mb-4">
          {language === "es"
            ? "Escanea el código QR del producto asignado para confirmar su recepción en la tienda"
            : "Scan the assigned product QR code to confirm reception at the store"}
        </p>

        {/* Input manual o escaneado */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === "es" ? "Código del Producto" : "Product Code"}
          </label>
          <input
            type="text"
            placeholder={t.scanPlaceholder}
            value={receiveCode}
            onChange={(e) => setReceiveCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Botón para activar cámara */}
        <button
          type="button"
          onClick={() => setReceiveCameraOn(!receiveCameraOn)}
          className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg font-semibold py-3 text-lg"
        >
          {receiveCameraOn
            ? language === "es"
              ? "❌ Cerrar Cámara"
              : "❌ Close Camera"
            : language === "es"
            ? "📷 Escanear QR"
            : "📷 Scan QR"}
        </button>

        {/* Escáner de QR */}
        {receiveCameraOn && (
          <div className="mt-3 flex justify-end">
            <div
              className="w-full max-w-sm ml-auto"
              id="qr-reader-receive"
            ></div>
          </div>
        )}

        {/* Mostrar información del producto si se escaneó */}
        {receiveCode && (
          <div className="bg-white/10 rounded-lg p-4 border border-orange-500/30">
            <div className="text-sm text-white/60 mb-1">
              {language === "es" ? "Código escaneado:" : "Scanned code:"}
            </div>
            <div className="font-mono text-lg text-orange-300">
              {receiveCode}
            </div>
            {(() => {
              const item = inventory.find((i) => i.id === receiveCode);
              if (item) {
                return (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">
                        {language === "es" ? "Producto:" : "Product:"}
                      </span>
                      <span className="font-semibold">{item.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">
                        {language === "es" ? "Peso:" : "Weight:"}
                      </span>
                      <span className="font-semibold">{item.weight} lb</span>
                    </div>
                    {item.assignedTo && (
                      <div className="flex justify-between">
                        <span className="text-white/60">
                          {language === "es" ? "Asignado a:" : "Assigned to:"}
                        </span>
                        <span className="font-semibold text-orange-300">
                          {item.assignedTo}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">
                        {language === "es" ? "Estado:" : "Status:"}
                      </span>
                      <span
                        className={`font-semibold ${
                          item.status === "received"
                            ? "text-green-400"
                            : item.status === "assigned"
                            ? "text-orange-400"
                            : "text-blue-400"
                        }`}
                      >
                        {item.status === "received"
                          ? language === "es"
                            ? "✅ Recibido"
                            : "✅ Received"
                          : item.status === "assigned"
                          ? language === "es"
                            ? "🚚 Asignado"
                            : "🚚 Assigned"
                          : language === "es"
                          ? "🧊 En Cooler"
                          : "🧊 In Cooler"}
                      </span>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        <button
          onClick={receiveInStore}
          className="w-full bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold py-3 text-lg"
        >
          {t.receive}
        </button>
      </div>
    </div>
  );

  // Renderizar pantalla de inventario
  const renderInventario = () => {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white">
        <div className="flex flex-col items-center p-6 min-h-full">
          <ToastContainer position="top-center" />

          {/* Header */}
          <div className="flex w-full max-w-6xl justify-between items-center mb-6">
            <button
              onClick={() => setCurrentScreen("menu")}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
            >
              ← {language === "es" ? "Volver" : "Back"}
            </button>
            <h1 className="text-2xl font-bold">
              {language === "es" ? "Inventario Total" : "Total Inventory"}
            </h1>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
            >
              {t.logout}
            </button>
          </div>

          {/* Botones de vista */}
          <div className="w-full max-w-6xl mb-6">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
              <button
                onClick={() => setInventoryView("summary")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "summary"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                {language === "es" ? "Por Producto" : "By Product"}
              </button>
              <button
                onClick={() => setInventoryView("byDate")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "byDate"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                {language === "es" ? "Por Fecha" : "By Date"}
              </button>
              <button
                onClick={() => setInventoryView("individual")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "individual"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                {language === "es" ? "Individual" : "Individual"}
              </button>
              <button
                onClick={() => setInventoryView("assigned")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "assigned"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                {language === "es" ? "Asignados" : "Assigned"}
              </button>
              <button
                onClick={() => setInventoryView("cooler")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "cooler"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                {language === "es" ? "En Cooler" : "In Cooler"}
              </button>
              <button
                onClick={() => setInventoryView("reports")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "reports"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                📊 {language === "es" ? "Reportes" : "Reports"}
              </button>
              <button
                onClick={() => setInventoryView("differences")}
                className={`py-3 px-3 rounded-lg font-semibold transition-all text-sm ${
                  inventoryView === "differences"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-transparent text-white/70 hover:bg-white/5"
                }`}
              >
                ⚖️ {language === "es" ? "Diferencias" : "Differences"}
              </button>
            </div>
          </div>

          {/* Vista sumarizada por producto */}
          {inventoryView === "summary" && (
            <div className="w-full max-w-6xl pb-8">
              {sortedGroups.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? "No hay productos en el inventario."
                      : "No items in inventory yet."}
                  </div>
                </div>
              )}

              {/* Grid de productos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedGroups.map((group) => (
                  <div
                    key={group.type}
                    className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6 hover:scale-105 hover:shadow-green-500/20 transition-all duration-300"
                  >
                    {/* Header con icono */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-3 rounded-xl">
                        <span className="text-3xl">🥩</span>
                      </div>
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-green-300">
                          {group.items.length}{" "}
                          {language === "es" ? "piezas" : "pieces"}
                        </span>
                      </div>
                    </div>

                    {/* Nombre del producto */}
                    <h3 className="text-xl font-bold text-white mb-4 tracking-wide">
                      {group.type}
                    </h3>

                    {/* Estadísticas */}
                    <div className="space-y-3">
                      {/* Peso total */}
                      <div className="bg-black/20 rounded-xl p-4 border border-green-500/30">
                        <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                          {language === "es" ? "Peso Total" : "Total Weight"}
                        </div>
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          {group.totalWeight.toFixed(2)}
                          <span className="text-xl text-white/80 ml-1">lb</span>
                        </div>
                      </div>

                      {/* Ubicación */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">📍</span>
                        <div>
                          <div className="font-semibold text-white/90">
                            {COOLER.name}
                          </div>
                          <div className="text-xs text-white/50">
                            {COOLER.address}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista por fecha */}
          {inventoryView === "byDate" && (
            <div className="w-full max-w-6xl space-y-8 pb-8">
              {sortedByDate.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📅</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? "No hay productos en el inventario."
                      : "No items in inventory yet."}
                  </div>
                </div>
              )}

              {sortedByDate.map((dateGroup) => (
                <div
                  key={dateGroup.date}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Header con gradiente */}
                  <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-6 border-b border-white/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">📅</span>
                          <h2 className="text-2xl font-bold text-white">
                            {new Date(dateGroup.date).toLocaleDateString(
                              language === "es" ? "es-ES" : "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </h2>
                        </div>
                        <div className="text-sm text-white/70 ml-12">
                          {dateGroup.items.length}{" "}
                          {language === "es"
                            ? "productos ingresados"
                            : "products entered"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                          {language === "es" ? "Total del día" : "Daily Total"}
                        </div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          {dateGroup.totalWeight.toFixed(2)}
                          <span className="text-2xl text-white/80 ml-1">
                            lb
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="p-6 space-y-3">
                    {dateGroup.items
                      .sort((a, b) => a.type.localeCompare(b.type))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <span className="text-2xl">🥩</span>
                                <div>
                                  <span className="font-bold text-lg text-white">
                                    {item.type}
                                  </span>
                                  <span className="text-white/50 mx-3">•</span>
                                  <span className="font-semibold text-green-400">
                                    {item.weight} lb
                                  </span>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    item.status === "in_cooler"
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                      : "bg-orange-500/20 text-orange-300 border border-orange-400/30"
                                  }`}
                                >
                                  {item.status === "in_cooler"
                                    ? language === "es"
                                      ? "En Cooler"
                                      : "In Cooler"
                                    : language === "es"
                                    ? "Asignado"
                                    : "Assigned"}
                                </span>
                              </div>
                              <div className="text-xs text-white/50 ml-12 flex items-center gap-3 flex-wrap">
                                <span className="font-mono bg-white/5 px-2 py-1 rounded">
                                  {item.id}
                                </span>
                                {item.plantWeight && (
                                  <>
                                    <span className="bg-purple-500/10 px-2 py-1 rounded text-purple-300 border border-purple-400/20">
                                      🏭{" "}
                                      {language === "es" ? "Planta" : "Plant"}:{" "}
                                      {item.plantWeight} lb
                                    </span>
                                    {item.plantWeight !== item.weight && (
                                      <span
                                        className={`px-2 py-1 rounded font-semibold ${
                                          item.plantWeight > item.weight
                                            ? "bg-red-500/10 text-red-300 border border-red-400/20"
                                            : "bg-green-500/10 text-green-300 border border-green-400/20"
                                        }`}
                                      >
                                        {item.plantWeight > item.weight
                                          ? "📉"
                                          : "📈"}{" "}
                                        {language === "es" ? "Dif" : "Diff"}:{" "}
                                        {(
                                          item.weight - item.plantWeight
                                        ).toFixed(2)}{" "}
                                        lb
                                      </span>
                                    )}
                                  </>
                                )}
                                {item.batchNumber && (
                                  <span className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-300 border border-indigo-400/20">
                                    📦 {language === "es" ? "Lote" : "Batch"}:{" "}
                                    {item.batchNumber}
                                  </span>
                                )}
                                {item.assignedTo && (
                                  <>
                                    <span className="mx-2">→</span>
                                    <span className="text-orange-300">
                                      {item.assignedTo}
                                    </span>
                                    {item.assignedAt && (
                                      <span className="ml-2 text-white/40">
                                        (
                                        {new Date(
                                          item.assignedAt
                                        ).toLocaleDateString()}
                                        )
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => showQR(item)}
                              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                            >
                              📱 QR
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista individual */}
          {inventoryView === "individual" && (
            <div className="w-full max-w-6xl pb-8">
              {/* Header con estadísticas */}
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-8 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">
                      {language === "es"
                        ? "📋 Todas las Piezas"
                        : "📋 All Pieces"}
                    </h2>
                    <p className="text-white/60">
                      {language === "es"
                        ? "Lista completa del inventario"
                        : "Complete inventory list"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 px-6 py-4 rounded-xl border border-green-400/30">
                    <div className="text-sm text-white/60 uppercase tracking-wider mb-1">
                      {language === "es" ? "Total" : "Total"}
                    </div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                      {inventory.length}
                      <span className="text-xl text-white/80 ml-2">
                        {language === "es" ? "pzs" : "pcs"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {inventory.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? "No hay productos en el inventario."
                      : "No items in inventory yet."}
                  </div>
                </div>
              )}

              {/* Lista de productos */}
              <div className="space-y-3">
                {inventory
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-xl shadow-lg hover:shadow-2xl hover:border-white/40 transition-all duration-300 overflow-hidden group"
                    >
                      <div className="flex items-center p-5">
                        {/* Número de orden */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 w-12 h-12 rounded-xl flex items-center justify-center mr-4 font-bold text-white group-hover:scale-110 transition-transform">
                          #{index + 1}
                        </div>

                        {/* Icono del producto */}
                        <div className="mr-4">
                          <span className="text-4xl">🥩</span>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-white">
                              {item.type}
                            </h3>
                            <div className="h-1 w-1 rounded-full bg-white/30"></div>
                            <span className="font-bold text-lg text-green-400">
                              {item.weight} lb
                            </span>
                            <div className="h-1 w-1 rounded-full bg-white/30"></div>
                            <span className="text-sm text-white/60">
                              📅 {item.date}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === "in_cooler"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                  : "bg-orange-500/20 text-orange-300 border border-orange-400/30"
                              }`}
                            >
                              {item.status === "in_cooler"
                                ? language === "es"
                                  ? "🧊 En Cooler"
                                  : "🧊 In Cooler"
                                : language === "es"
                                ? "🚚 Asignado"
                                : "🚚 Assigned"}
                            </span>
                          </div>

                          {/* Información secundaria */}
                          <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                            <span className="font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                              ID: {item.id}
                            </span>
                            {item.plantWeight && (
                              <>
                                <span className="bg-purple-500/10 px-2 py-1 rounded text-purple-300 border border-purple-400/20">
                                  🏭 {language === "es" ? "Planta" : "Plant"}:{" "}
                                  {item.plantWeight} lb
                                </span>
                                {item.plantWeight !== item.weight && (
                                  <span
                                    className={`px-2 py-1 rounded font-semibold ${
                                      item.plantWeight > item.weight
                                        ? "bg-red-500/10 text-red-300 border border-red-400/20"
                                        : "bg-green-500/10 text-green-300 border border-green-400/20"
                                    }`}
                                  >
                                    {item.plantWeight > item.weight
                                      ? "📉"
                                      : "📈"}{" "}
                                    {language === "es" ? "Dif" : "Diff"}:{" "}
                                    {(item.weight - item.plantWeight).toFixed(
                                      2
                                    )}{" "}
                                    lb
                                  </span>
                                )}
                              </>
                            )}
                            {item.batchNumber && (
                              <span className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-300 border border-indigo-400/20">
                                📦 {language === "es" ? "Lote" : "Batch"}:{" "}
                                {item.batchNumber}
                              </span>
                            )}
                            {item.assignedTo && (
                              <>
                                <span>→</span>
                                <span className="bg-orange-500/10 px-2 py-1 rounded text-orange-300 border border-orange-400/20">
                                  📍 {item.assignedTo}
                                </span>
                                {item.assignedAt && (
                                  <span className="text-white/40">
                                    (
                                    {new Date(
                                      item.assignedAt
                                    ).toLocaleDateString()}
                                    )
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Botón QR */}
                        <button
                          onClick={() => showQR(item)}
                          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-emerald-600 hover:to-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-110 group-hover:animate-pulse"
                        >
                          <span className="text-2xl">📱</span>
                          <span className="ml-2">QR</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Vista de Inventarios Asignados por Carnicería */}
          {inventoryView === "assigned" && (
            <div className="w-full max-w-6xl pb-8">
              {assignedByStore.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🏪</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? "No hay inventarios asignados a carnicerías."
                      : "No inventory assigned to butcher shops."}
                  </div>
                </div>
              )}

              {/* Grid de carnicerías */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedByStore.map((store) => (
                  <div
                    key={store.storeName}
                    className="bg-gradient-to-br from-orange-900/30 to-orange-950/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl p-6 hover:scale-105 hover:shadow-orange-500/20 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-3 rounded-xl">
                        <span className="text-3xl">🏪</span>
                      </div>
                      <div className="bg-orange-500/20 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-orange-300">
                          {store.items.length}{" "}
                          {language === "es" ? "piezas" : "pieces"}
                        </span>
                      </div>
                    </div>

                    {/* Nombre de la carnicería */}
                    <h3 className="text-xl font-bold text-white mb-4 tracking-wide">
                      {store.storeName}
                    </h3>

                    {/* Peso total */}
                    <div className="bg-black/20 rounded-xl p-4 border border-orange-500/30 mb-4">
                      <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                        {language === "es" ? "Peso Total" : "Total Weight"}
                      </div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                        {store.totalWeight.toFixed(2)}
                        <span className="text-xl text-white/80 ml-1">lb</span>
                      </div>
                    </div>

                    {/* Lista de productos */}
                    <div className="space-y-2">
                      <div className="text-xs text-white/60 uppercase tracking-wider mb-2">
                        {language === "es" ? "Productos" : "Products"}
                      </div>
                      {store.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/5 rounded-lg p-2 text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white/90">{item.type}</span>
                            <span className="text-orange-300 font-semibold">
                              {item.weight} lb
                            </span>
                          </div>
                        </div>
                      ))}
                      {store.items.length > 3 && (
                        <div className="text-xs text-white/40 text-center pt-2">
                          +{store.items.length - 3}{" "}
                          {language === "es" ? "más" : "more"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista de Total en Cooler Principal */}
          {inventoryView === "cooler" && (
            <div className="w-full max-w-6xl pb-8">
              {coolerInventory.groups.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🧊</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? "No hay productos en el Cooler Principal."
                      : "No items in Cooler."}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setCurrentScreen("coolerDetail")}
                  className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-8 cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-blue-500/30 max-w-2xl mx-auto"
                >
                  <div className="flex items-center gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl">
                      <span className="text-7xl">🧊</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {COOLER.name}
                      </h2>
                      <p className="text-base text-white/60">
                        {COOLER.address}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-black/20 rounded-xl p-6 border border-blue-500/30">
                    <div>
                      <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                        {language === "es" ? "Peso Total" : "Total Weight"}
                      </div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                        {coolerInventory.totalWeight.toFixed(2)}
                        <span className="text-3xl text-white/80 ml-1">lb</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                        {language === "es" ? "Productos" : "Products"}
                      </div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                        {coolerInventory.groups.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center text-white/60 text-sm">
                    {language === "es"
                      ? "Toca para ver detalles"
                      : "Tap to view details"}{" "}
                    →
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista de Reportes */}
          {inventoryView === "reports" && (
            <div className="w-full max-w-6xl pb-8">
              {/* Controles de período */}
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-950/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  📊{" "}
                  {language === "es"
                    ? "Reporte de Envíos por Carnicería"
                    : "Store Shipment Report"}
                </h2>

                {/* Selector de período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      {language === "es" ? "Período" : "Period"}
                    </label>
                    <select
                      value={reportPeriod}
                      onChange={(e) => {
                        setReportPeriod(e.target.value);
                        setReportWeekStart("");
                        setReportMonth("");
                      }}
                      className="w-full bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="week">
                        {language === "es" ? "Por Semana" : "By Week"}
                      </option>
                      <option value="month">
                        {language === "es" ? "Por Mes" : "By Month"}
                      </option>
                    </select>
                  </div>

                  {reportPeriod === "week" && (
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">
                        {language === "es"
                          ? "Inicio de Semana (Domingo)"
                          : "Week Start (Sunday)"}
                      </label>
                      <input
                        type="date"
                        value={reportWeekStart}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const sunday = getSundayOfWeek(selectedDate);
                          setReportWeekStart(formatDate(sunday));
                        }}
                        className="w-full bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {reportWeekStart && (
                        <p className="text-xs text-white/60 mt-1">
                          {language === "es"
                            ? `Semana del ${reportWeekStart} al ${formatDate(
                                new Date(
                                  new Date(reportWeekStart).getTime() +
                                    6 * 24 * 60 * 60 * 1000
                                )
                              )}`
                            : `Week from ${reportWeekStart} to ${formatDate(
                                new Date(
                                  new Date(reportWeekStart).getTime() +
                                    6 * 24 * 60 * 60 * 1000
                                )
                              )}`}
                        </p>
                      )}
                    </div>
                  )}

                  {reportPeriod === "month" && (
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">
                        {language === "es" ? "Mes" : "Month"}
                      </label>
                      <input
                        type="month"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Resultados del reporte */}
              {generateStoreReport && generateStoreReport.length > 0 ? (
                <div className="space-y-6">
                  {generateStoreReport.map((storeData) => (
                    <div
                      key={storeData.store}
                      className="bg-gradient-to-br from-purple-900/20 to-pink-950/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-6"
                    >
                      {/* Header de la tienda */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-4 rounded-xl">
                            <span className="text-4xl">🏪</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">
                              {storeData.store}
                            </h3>
                            <p className="text-sm text-white/60">
                              {storeData.items.length}{" "}
                              {language === "es"
                                ? "productos enviados"
                                : "products shipped"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                            {language === "es"
                              ? "Total Libras"
                              : "Total Pounds"}
                          </div>
                          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            {storeData.totalWeight.toFixed(2)}
                            <span className="text-2xl text-white/80 ml-1">
                              lb
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desglose por producto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.values(storeData.productTypes).map(
                          (productData) => (
                            <div
                              key={productData.type}
                              className="bg-black/20 rounded-xl p-4 border border-purple-500/20"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-lg font-bold text-white">
                                  {productData.type}
                                </h4>
                                <span className="bg-purple-500/20 px-2 py-1 rounded-full text-xs font-semibold text-purple-300">
                                  {productData.count}{" "}
                                  {language === "es" ? "pzs" : "pcs"}
                                </span>
                              </div>
                              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                {productData.weight.toFixed(2)}
                                <span className="text-xl text-white/80 ml-1">
                                  lb
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-xl text-white/60">
                    {language === "es"
                      ? reportWeekStart || reportMonth
                        ? "No hay envíos en este período"
                        : "Selecciona un período para ver el reporte"
                      : reportWeekStart || reportMonth
                      ? "No shipments in this period"
                      : "Select a period to view the report"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista de Diferencias de Peso */}
          {inventoryView === "differences" && (
            <div className="w-full max-w-6xl pb-8">
              {(() => {
                const itemsWithDifferences = inventory.filter(
                  (item) => item.plantWeight && item.plantWeight !== item.weight
                );

                if (itemsWithDifferences.length === 0) {
                  return (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">⚖️</div>
                      <div className="text-xl text-white/60">
                        {language === "es"
                          ? "No hay diferencias de peso registradas"
                          : "No weight differences recorded"}
                      </div>
                    </div>
                  );
                }

                // Si hay un lote seleccionado, mostrar detalle
                if (selectedBatchForDiff) {
                  const batchItems = itemsWithDifferences.filter(
                    (item) => item.batchNumber === selectedBatchForDiff
                  );

                  const totalPlantWeight = batchItems.reduce(
                    (sum, item) => sum + item.plantWeight,
                    0
                  );
                  const totalCoolerWeight = batchItems.reduce(
                    (sum, item) => sum + item.weight,
                    0
                  );
                  const totalDifference = totalCoolerWeight - totalPlantWeight;
                  const totalPercentChange = (
                    (totalDifference / totalPlantWeight) *
                    100
                  ).toFixed(2);
                  const isLoss = totalDifference < 0;

                  return (
                    <>
                      {/* Header con botón volver */}
                      <div className="bg-gradient-to-br from-yellow-900/30 to-orange-950/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-2xl p-6 mb-6">
                        <button
                          onClick={() => setSelectedBatchForDiff(null)}
                          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded mb-4"
                        >
                          ←{" "}
                          {language === "es"
                            ? "Volver a Lotes"
                            : "Back to Batches"}
                        </button>

                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-3xl font-black text-white mb-2">
                              📦 {language === "es" ? "Lote" : "Batch"}:{" "}
                              {selectedBatchForDiff}
                            </h2>
                            <p className="text-white/60">
                              {batchItems.length}{" "}
                              {language === "es"
                                ? "productos con diferencias"
                                : "products with differences"}
                            </p>
                          </div>
                          <div
                            className={`px-6 py-4 rounded-xl border ${
                              isLoss
                                ? "bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30"
                                : "bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30"
                            }`}
                          >
                            <div className="text-sm text-white/60 uppercase tracking-wider mb-1">
                              {language === "es"
                                ? "Diferencia Total"
                                : "Total Difference"}
                            </div>
                            <div
                              className={`text-4xl font-black ${
                                isLoss ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {isLoss ? "📉" : "📈"}{" "}
                              {totalDifference > 0 ? "+" : ""}
                              {totalDifference.toFixed(2)}
                              <span className="text-xl text-white/80 ml-1">
                                lb
                              </span>
                            </div>
                            <div className="text-sm text-white/60 mt-1">
                              ({totalPercentChange > 0 ? "+" : ""}
                              {totalPercentChange}%)
                            </div>
                          </div>
                        </div>

                        {/* Resumen de pesos */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className="bg-purple-500/10 px-4 py-3 rounded-lg border border-purple-400/20">
                            <div className="text-xs text-purple-300 mb-1">
                              🏭{" "}
                              {language === "es"
                                ? "Total Planta"
                                : "Total Plant"}
                            </div>
                            <div className="text-2xl font-bold text-white">
                              {totalPlantWeight.toFixed(2)} lb
                            </div>
                          </div>
                          <div className="bg-blue-500/10 px-4 py-3 rounded-lg border border-blue-400/20">
                            <div className="text-xs text-blue-300 mb-1">
                              🧊{" "}
                              {language === "es"
                                ? "Total Cooler"
                                : "Total Cooler"}
                            </div>
                            <div className="text-2xl font-bold text-white">
                              {totalCoolerWeight.toFixed(2)} lb
                            </div>
                          </div>
                          <div
                            className={`px-4 py-3 rounded-lg border ${
                              isLoss
                                ? "bg-red-500/10 border-red-400/20"
                                : "bg-green-500/10 border-green-400/20"
                            }`}
                          >
                            <div
                              className={`text-xs mb-1 ${
                                isLoss ? "text-red-300" : "text-green-300"
                              }`}
                            >
                              ⚖️{" "}
                              {language === "es" ? "Diferencia" : "Difference"}
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                isLoss ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {totalDifference > 0 ? "+" : ""}
                              {totalDifference.toFixed(2)} lb
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de productos del lote */}
                      <div className="space-y-3">
                        {batchItems
                          .sort((a, b) => {
                            const diffA = Math.abs(a.weight - a.plantWeight);
                            const diffB = Math.abs(b.weight - b.plantWeight);
                            return diffB - diffA;
                          })
                          .map((item, index) => {
                            const difference = item.weight - item.plantWeight;
                            const percentChange = (
                              (difference / item.plantWeight) *
                              100
                            ).toFixed(2);
                            const isItemLoss = difference < 0;

                            return (
                              <div
                                key={item.id}
                                className={`bg-gradient-to-r backdrop-blur-md border rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group ${
                                  isItemLoss
                                    ? "from-red-900/20 to-red-950/10 border-red-500/30 hover:border-red-400/50"
                                    : "from-green-900/20 to-green-950/10 border-green-500/30 hover:border-green-400/50"
                                }`}
                              >
                                <div className="flex items-center p-5">
                                  {/* Número de orden */}
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 font-bold text-white group-hover:scale-110 transition-transform ${
                                      isItemLoss
                                        ? "bg-gradient-to-br from-red-500/20 to-red-600/20"
                                        : "bg-gradient-to-br from-green-500/20 to-green-600/20"
                                    }`}
                                  >
                                    #{index + 1}
                                  </div>

                                  {/* Icono del producto */}
                                  <div className="mr-4">
                                    <span className="text-4xl">🥩</span>
                                  </div>

                                  {/* Información principal */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                      <h3 className="font-bold text-xl text-white">
                                        {item.type}
                                      </h3>
                                      <div className="h-1 w-1 rounded-full bg-white/30"></div>
                                      <span className="text-sm text-white/60">
                                        📅 {item.date}
                                      </span>
                                    </div>

                                    {/* Comparación de pesos */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                                      <div className="bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-400/20">
                                        <div className="text-xs text-purple-300 mb-1">
                                          🏭{" "}
                                          {language === "es"
                                            ? "Planta"
                                            : "Plant"}
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                          {item.plantWeight} lb
                                        </div>
                                      </div>
                                      <div className="bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-400/20">
                                        <div className="text-xs text-blue-300 mb-1">
                                          🧊 Cooler
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                          {item.weight} lb
                                        </div>
                                      </div>
                                      <div
                                        className={`px-3 py-2 rounded-lg border ${
                                          isItemLoss
                                            ? "bg-red-500/10 border-red-400/20"
                                            : "bg-green-500/10 border-green-400/20"
                                        }`}
                                      >
                                        <div
                                          className={`text-xs mb-1 ${
                                            isItemLoss
                                              ? "text-red-300"
                                              : "text-green-300"
                                          }`}
                                        >
                                          {isItemLoss ? "📉" : "📈"}{" "}
                                          {language === "es"
                                            ? "Diferencia"
                                            : "Difference"}
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            isItemLoss
                                              ? "text-red-400"
                                              : "text-green-400"
                                          }`}
                                        >
                                          {difference > 0 ? "+" : ""}
                                          {difference.toFixed(2)} lb
                                          <span className="text-sm ml-2">
                                            ({percentChange > 0 ? "+" : ""}
                                            {percentChange}%)
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* ID del item */}
                                    <div className="text-xs text-white/50">
                                      <span className="font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                                        ID: {item.id}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Botón QR */}
                                  <button
                                    onClick={() => showQR(item)}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-emerald-600 hover:to-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-110 group-hover:animate-pulse"
                                  >
                                    <span className="text-2xl">📱</span>
                                    <span className="ml-2">QR</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  );
                }

                // Vista principal: Agrupar por lotes (solo items CON batchNumber)
                const batchGroups = {};
                itemsWithDifferences.forEach((item) => {
                  // Solo incluir items que tienen batchNumber
                  if (!item.batchNumber) return;
                  
                  const batch = item.batchNumber;
                  if (!batchGroups[batch]) {
                    batchGroups[batch] = {
                      batchNumber: batch,
                      items: [],
                      totalPlantWeight: 0,
                      totalCoolerWeight: 0,
                    };
                  }
                  batchGroups[batch].items.push(item);
                  batchGroups[batch].totalPlantWeight += (item.plantWeight || 0);
                  batchGroups[batch].totalCoolerWeight += (item.weight || 0);
                });

                const sortedBatches = Object.values(batchGroups).sort(
                  (a, b) => {
                    // Ordenar por batch number descendente (más reciente primero)
                    return b.batchNumber.localeCompare(a.batchNumber);
                  }
                );

                // Si no hay lotes con batchNumber, mostrar mensaje
                if (sortedBatches.length === 0) {
                  return (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">📦</div>
                      <div className="text-xl text-white/60">
                        {language === "es"
                          ? "No hay lotes con diferencias de peso"
                          : "No batches with weight differences"}
                      </div>
                      <div className="text-sm text-white/40 mt-2">
                        {language === "es"
                          ? "Las diferencias solo se muestran para productos con número de lote asignado"
                          : "Differences are only shown for products with assigned batch numbers"}
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Header con estadísticas */}
                    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-950/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-2xl p-8 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-black text-white mb-2">
                            {language === "es"
                              ? "⚖️ Diferencias por Lote"
                              : "⚖️ Differences by Batch"}
                          </h2>
                          <p className="text-white/60">
                            {language === "es"
                              ? "Selecciona un lote para ver detalles"
                              : "Select a batch to view details"}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 px-6 py-4 rounded-xl border border-yellow-400/30">
                          <div className="text-sm text-white/60 uppercase tracking-wider mb-1">
                            {language === "es"
                              ? "Total Lotes"
                              : "Total Batches"}
                          </div>
                          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                            {sortedBatches.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grid de lotes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedBatches.map((batch) => {
                        const difference =
                          batch.totalCoolerWeight - batch.totalPlantWeight;
                        const percentChange = (
                          (difference / batch.totalPlantWeight) *
                          100
                        ).toFixed(2);
                        const isLoss = difference < 0;

                        return (
                          <div
                            key={batch.batchNumber}
                            onClick={() =>
                              setSelectedBatchForDiff(batch.batchNumber)
                            }
                            className={`backdrop-blur-xl border rounded-2xl shadow-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer ${
                              isLoss
                                ? "bg-gradient-to-br from-red-900/30 to-red-950/20 border-red-500/30 hover:shadow-red-500/20"
                                : "bg-gradient-to-br from-green-900/30 to-green-950/20 border-green-500/30 hover:shadow-green-500/20"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div
                                className={`p-3 rounded-xl ${
                                  isLoss
                                    ? "bg-gradient-to-br from-red-500/20 to-red-600/20"
                                    : "bg-gradient-to-br from-green-500/20 to-green-600/20"
                                }`}
                              >
                                <span className="text-3xl">📦</span>
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full ${
                                  isLoss ? "bg-red-500/20" : "bg-green-500/20"
                                }`}
                              >
                                <span
                                  className={`text-xs font-semibold ${
                                    isLoss ? "text-red-300" : "text-green-300"
                                  }`}
                                >
                                  {batch.items.length}{" "}
                                  {language === "es" ? "items" : "items"}
                                </span>
                              </div>
                            </div>

                            {/* Nombre del lote */}
                            <h3 className="text-xl font-bold text-white mb-4 tracking-wide">
                              {batch.batchNumber}
                            </h3>

                            {/* Diferencia total */}
                            <div
                              className={`rounded-xl p-4 border mb-4 ${
                                isLoss
                                  ? "bg-black/20 border-red-500/30"
                                  : "bg-black/20 border-green-500/30"
                              }`}
                            >
                              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                                {isLoss ? "📉" : "📈"}{" "}
                                {language === "es"
                                  ? "Diferencia Total"
                                  : "Total Difference"}
                              </div>
                              <div
                                className={`text-3xl font-black ${
                                  isLoss ? "text-red-400" : "text-green-400"
                                }`}
                              >
                                {difference > 0 ? "+" : ""}
                                {difference.toFixed(2)}
                                <span className="text-xl text-white/80 ml-1">
                                  lb
                                </span>
                              </div>
                              <div className="text-sm text-white/60 mt-1">
                                ({percentChange > 0 ? "+" : ""}
                                {percentChange}%)
                              </div>
                            </div>

                            {/* Resumen de pesos */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-purple-300">
                                  🏭 {language === "es" ? "Planta" : "Plant"}:
                                </span>
                                <span className="text-white font-semibold">
                                  {batch.totalPlantWeight.toFixed(2)} lb
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-300">
                                  🧊 Cooler:
                                </span>
                                <span className="text-white font-semibold">
                                  {batch.totalCoolerWeight.toFixed(2)} lb
                                </span>
                              </div>
                            </div>

                            {/* Indicador de clic */}
                            <div className="mt-4 text-center text-xs text-white/40">
                              {language === "es"
                                ? "Click para ver detalles →"
                                : "Click to view details →"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Modal QR */}
          {qrItem && currentScreen === "inventario" && (
            <div
              className="fixed inset-0 bg-black/70 grid place-items-center z-50"
              onClick={() => setQrItem(null)}
            >
              <div
                className="bg-white text-black rounded-2xl p-6 w-[420px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-bold text-lg mb-3">
                  {language === "es" ? "Etiqueta para" : "Label for"}:{" "}
                  {qrItem.type} — {qrItem.weight} lb
                </div>
                <img
                  src={qrDataUrl}
                  alt="qr"
                  className="mx-auto mb-3 w-48 h-48"
                />
                <div className="text-sm mb-4">
                  <strong>ID:</strong> {qrItem.id}
                  <br />
                  <strong>{language === "es" ? "Fecha" : "Date"}:</strong>{" "}
                  {qrItem.date}
                  <br />
                  <strong>
                    {language === "es" ? "Ubicación" : "Location"}:
                  </strong>{" "}
                  {COOLER.name} — {COOLER.address}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
                    onClick={() => setQrItem(null)}
                  >
                    {language === "es" ? "Cerrar" : "Close"}
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={downloadLabelPng}
                  >
                    {language === "es" ? "Descargar PNG" : "Download PNG"}
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={printLabel}
                  >
                    {t.print}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista detallada del Cooler Principal
  const renderCoolerDetail = () => {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white">
        <div className="flex flex-col items-center p-6 min-h-full">
          <ToastContainer position="top-center" />

          {/* Header */}
          <div className="flex w-full max-w-6xl justify-between items-center mb-6">
            <button
              onClick={() => setCurrentScreen("inventario")}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
            >
              ← {language === "es" ? "Volver" : "Back"}
            </button>
            <h1 className="text-2xl font-bold">
              {language === "es" ? "Detalle del Cooler" : "Cooler Detail"}
            </h1>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
            >
              {t.logout}
            </button>
          </div>

          {/* Información del Cooler */}
          <div className="w-full max-w-6xl mb-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl">
                  <span className="text-7xl">🧊</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {COOLER.name}
                  </h2>
                  <p className="text-base text-white/60">{COOLER.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-black/20 rounded-xl p-6 border border-blue-500/30">
                <div>
                  <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                    {language === "es" ? "Peso Total" : "Total Weight"}
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                    {coolerInventory.totalWeight.toFixed(2)}
                    <span className="text-3xl text-white/80 ml-1">lb</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                    {language === "es" ? "Productos" : "Products"}
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                    {coolerInventory.groups.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="w-full max-w-6xl pb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              {language === "es" ? "Productos en Cooler" : "Products in Cooler"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coolerInventory.groups.map((group) => (
                <div
                  key={group.type}
                  onClick={() => {
                    setSelectedProductGroup(group);
                    setCurrentScreen("productDetail");
                  }}
                  className="bg-gradient-to-br from-blue-900/20 to-cyan-950/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-6 hover:scale-105 hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 p-3 rounded-xl">
                      <span className="text-3xl">🥩</span>
                    </div>
                    <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-blue-300">
                        {group.items.length}{" "}
                        {language === "es" ? "piezas" : "pieces"}
                      </span>
                    </div>
                  </div>

                  {/* Nombre del producto */}
                  <h3 className="text-xl font-bold text-white mb-4 tracking-wide">
                    {group.type}
                  </h3>

                  {/* Peso total */}
                  <div className="bg-black/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                      {language === "es" ? "Peso Total" : "Total Weight"}
                    </div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                      {group.totalWeight.toFixed(2)}
                      <span className="text-xl text-white/80 ml-1">lb</span>
                    </div>
                  </div>

                  {/* Indicador clickeable */}
                  <div className="mt-4 text-center text-white/50 text-xs">
                    {language === "es"
                      ? "Toca para ver items"
                      : "Tap to view items"}{" "}
                    →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista de detalle de un producto específico
  const renderProductDetail = () => {
    if (!selectedProductGroup) {
      setCurrentScreen("coolerDetail");
      return null;
    }

    return (
      <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-[#3b0d0d] to-[#111827] text-white">
        <div className="flex flex-col items-center p-6 min-h-full">
          <ToastContainer position="top-center" />

          {/* Header */}
          <div className="flex w-full max-w-6xl justify-between items-center mb-6">
            <button
              onClick={() => {
                setCurrentScreen("coolerDetail");
                setSelectedProductGroup(null);
              }}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
            >
              ← {language === "es" ? "Volver" : "Back"}
            </button>
            <h1 className="text-2xl font-bold">{selectedProductGroup.type}</h1>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
            >
              {t.logout}
            </button>
          </div>

          {/* Información del producto */}
          <div className="w-full max-w-6xl mb-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl">
                  <span className="text-7xl">🥩</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedProductGroup.type}
                  </h2>
                  <p className="text-base text-white/60">
                    {COOLER.name} • {COOLER.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-black/20 rounded-xl p-6 border border-blue-500/30">
                <div>
                  <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                    {language === "es" ? "Total Items" : "Total Items"}
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                    {selectedProductGroup.items.length}
                    <span className="text-3xl text-white/80 ml-2">
                      {language === "es" ? "pzs" : "pcs"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                    {language === "es" ? "Peso Total" : "Total Weight"}
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                    {selectedProductGroup.totalWeight.toFixed(2)}
                    <span className="text-3xl text-white/80 ml-1">lb</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de items individuales */}
          <div className="w-full max-w-6xl pb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              {language === "es" ? "Items Individuales" : "Individual Items"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProductGroup.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-blue-900/20 to-cyan-950/10 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-xl p-5 hover:scale-105 hover:shadow-blue-500/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs text-white/60 mb-1">
                        {language === "es" ? "Peso" : "Weight"}
                      </div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                        {item.weight}
                        <span className="text-xl text-white/80 ml-1">lb</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/60 mb-1">
                        {language === "es" ? "Fecha" : "Date"}
                      </div>
                      <div className="text-sm text-white font-semibold">
                        {item.date}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs text-white/50">
                      <span>ID: {item.id.slice(0, 8)}...</span>
                      <span className="bg-blue-500/20 px-2 py-1 rounded">
                        {COOLER.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pantalla de Descarga (marcar delivered_to_facility)
  const renderDescarga = () => (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#0d3b3b] to-[#111827] text-white p-6">
      <ToastContainer position="top-center" />
      <div className="flex w-full max-w-3xl justify-between items-center mb-6">
        <button
          onClick={() => setCurrentScreen("menu")}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          ← {t.back}
        </button>
        <h1 className="text-2xl font-bold">{t.deliveryTitle}</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
        >
          {t.logout}
        </button>
      </div>
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 space-y-4">
        <p className="text-white/80 text-sm">{t.deliveryDesc}</p>

        <div>
          <label className="block text-sm font-medium mb-2">
            {language === "es" ? "Código del Producto" : "Product Code"}
          </label>
          <input
            type="text"
            value={deliverCode}
            onChange={(e) => setDeliverCode(e.target.value)}
            placeholder={t.scanPlaceholder}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setDeliverCameraOn(!deliverCameraOn)}
          className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg font-semibold py-3 text-lg"
        >
          {deliverCameraOn ? `❌ ${t.closeCamera}` : `📷 ${t.scanQR}`}
        </button>

        {deliverCameraOn && (
          <div className="mt-3 flex justify-end">
            <div
              className="w-full max-w-sm ml-auto"
              id="qr-reader-deliver"
            ></div>
          </div>
        )}

        <button
          onClick={deliverToFacility}
          className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold py-3 text-lg"
        >
          {t.deliveryButton}
        </button>
      </div>
    </div>
  );

  // Pantalla de Ingreso a Cooler (confirmar in_cooler)
  const renderCoolerIntake = () => {
    // Buscar el item escaneado para mostrar información
    const scannedItem = coolerIntakeCode
      ? inventory.find((i) => i.id === coolerIntakeCode)
      : null;

    return (
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#0d1a3b] to-[#111827] text-white p-6">
        <ToastContainer position="top-center" />
        <div className="flex w-full max-w-3xl justify-between items-center mb-6">
          <button
            onClick={() => {
              setCurrentScreen("menu");
              setCoolerIntakeCode("");
              setCoolerIntakeWeight("");
            }}
            className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
          >
            ← {t.back}
          </button>
          <h1 className="text-2xl font-bold">{t.coolerIntakeTitle}</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
          >
            {t.logout}
          </button>
        </div>

        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 space-y-4">
          <p className="text-white/80 text-sm">{t.coolerIntakeDesc}</p>

          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "es" ? "Código del Producto" : "Product Code"}
            </label>
            <input
              type="text"
              value={coolerIntakeCode}
              onChange={(e) => setCoolerIntakeCode(e.target.value)}
              placeholder={t.scanPlaceholder}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setCoolerIntakeCameraOn(!coolerIntakeCameraOn)}
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg font-semibold py-3 text-lg"
          >
            {coolerIntakeCameraOn ? `❌ ${t.closeCamera}` : `📷 ${t.scanQR}`}
          </button>

          {coolerIntakeCameraOn && (
            <div className="mt-3 flex justify-end">
              <div
                className="w-full max-w-sm ml-auto"
                id="qr-reader-cooler-intake"
              ></div>
            </div>
          )}

          {/* Mostrar información del producto escaneado */}
          {scannedItem && (
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30 space-y-3">
              <h3 className="text-lg font-bold text-blue-300">
                {t.productInfo}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/60">
                    {language === "es" ? "Producto:" : "Product:"}
                  </span>
                  <div className="font-semibold text-white">
                    {scannedItem.type}
                  </div>
                </div>
                <div>
                  <span className="text-white/60">
                    {language === "es" ? "Fecha:" : "Date:"}
                  </span>
                  <div className="font-semibold text-white">
                    {scannedItem.date}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-white/60">{t.plantWeight}:</span>
                  <div className="font-bold text-green-400 text-2xl">
                    {scannedItem.weight} lb
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {language === "es"
                      ? "(Peso registrado por Helen en la planta)"
                      : "(Weight registered by Helen at plant)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input para peso del cooler */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.coolerWeight} *
            </label>
            <input
              type="number"
              step="0.01"
              value={coolerIntakeWeight}
              onChange={(e) => setCoolerIntakeWeight(e.target.value)}
              placeholder={
                language === "es"
                  ? "Ingresa el peso real en el cooler"
                  : "Enter actual cooler weight"
              }
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-white/50 mt-1">
              {language === "es"
                ? "Este será el peso oficial del producto en el sistema"
                : "This will be the official product weight in the system"}
            </p>
          </div>

          <button
            onClick={intakeToCooler}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold py-3 text-lg"
          >
            {t.coolerIntakeButton}
          </button>
        </div>
      </div>
    );
  };

  // Vista principal - mostrar pantalla según estado
  return currentScreen === "menu"
    ? renderMenu()
    : currentScreen === "ingreso"
    ? renderIngreso()
    : currentScreen === "descarga"
    ? renderDescarga()
    : currentScreen === "coolerIntake"
    ? renderCoolerIntake()
    : currentScreen === "retiro"
    ? renderRetiro()
    : currentScreen === "recepcion"
    ? renderRecepcion()
    : currentScreen === "coolerDetail"
    ? renderCoolerDetail()
    : currentScreen === "productDetail"
    ? renderProductDetail()
    : renderInventario();
}
