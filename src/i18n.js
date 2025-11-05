import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      title: "Ordonez Butcher Shop Inventory",
      login: "Administrator Login",
      password: "Enter Password",
      access: "Access System",
      logout: "Logout",
      addItem: "Add Item",
      product: "Product Name",
      weight: "Weight (lbs)",
      location: "Location",
      save: "Save",
      delete: "Delete",
      backup: "Backup Data",
      restore: "Restore Data",
      language: "Language",
      errorPass: "Incorrect password",
      successAdd: "Item added successfully!",
    },
  },
  es: {
    translation: {
      title: "Inventario Ordoñez Butcher Shop",
      login: "Acceso Administrador",
      password: "Ingrese Contraseña",
      access: "Entrar al Sistema",
      logout: "Cerrar Sesión",
      addItem: "Agregar Producto",
      product: "Nombre del Producto",
      weight: "Peso (lbs)",
      location: "Ubicación",
      save: "Guardar",
      delete: "Eliminar",
      backup: "Respaldar Datos",
      restore: "Restaurar Datos",
      language: "Idioma",
      errorPass: "Contraseña incorrecta",
      successAdd: "¡Producto agregado correctamente!",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "en",
  interpolation: { escapeValue: false },
});

export default i18n;
