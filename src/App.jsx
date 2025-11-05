import React, { useState, useEffect } from "react";
import "./index.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Idiomas
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
    save: "Save",
    noData: "No items in inventory yet.",
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
    save: "Guardar",
    noData: "No hay productos en el inventario.",
  },
};

// Datos de acceso (seguridad básica)
const ADMIN_USER = "admin";
const ADMIN_PASS = "Morchione0506@";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [loggedIn, setLoggedIn] = useState(false);
  const [form, setForm] = useState({
    type: "",
    weight: "",
    date: "",
    location: "",
  });
  const [inventory, setInventory] = useState([]);

  // Cargar inventario guardado
  useEffect(() => {
    const stored = localStorage.getItem("inventory");
    if (stored) setInventory(JSON.parse(stored));
  }, []);

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  // Login
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

  // Guardar producto
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.type || !form.weight || !form.date || !form.location) {
      toast.warning("⚠️ Please fill all fields!");
      return;
    }
    const newItem = { ...form, id: Date.now() };
    setInventory([...inventory, newItem]);
    setForm({ type: "", weight: "", date: "", location: "" });
    toast.success("✅ Saved successfully!");
  };

  // Cerrar sesión
  const handleLogout = () => {
    setLoggedIn(false);
  };

  const t = texts[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 to-gray-900 text-white p-4">
      <ToastContainer position="top-center" />

      {/* Selector de idioma */}
      <div className="absolute top-4 right-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-800 text-white border border-gray-500 rounded px-2 py-1"
        >
          <option value="en">🇺🇸 EN</option>
          <option value="es">🇪🇸 ES</option>
        </select>
      </div>

      {/* Login */}
      {!loggedIn ? (
        <form
          onSubmit={handleLogin}
          className="bg-white/10 p-6 rounded-2xl shadow-xl w-80 text-center"
        >
          <h2 className="text-2xl mb-4 font-bold">{t.loginTitle}</h2>
          <input
            name="user"
            placeholder={t.username}
            className="w-full mb-3 px-3 py-2 rounded text-black"
          />
          <input
            name="pass"
            type="password"
            placeholder={t.password}
            className="w-full mb-4 px-3 py-2 rounded text-black"
          />
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded font-semibold w-full"
          >
            {t.login}
          </button>
        </form>
      ) : (
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
          <button
            onClick={handleLogout}
            className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
          >
            {t.logout}
          </button>

          {/* Formulario */}
          <form
            onSubmit={handleSave}
            className="bg-white/10 p-4 rounded-2xl shadow-lg mb-6 flex flex-wrap gap-2 justify-center"
          >
            <input
              type="text"
              placeholder={t.meatType}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded text-black"
            />
            <input
              type="number"
              placeholder={t.weight}
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="px-3 py-2 rounded text-black"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-3 py-2 rounded text-black"
            />
            <input
              type="text"
              placeholder={t.location}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="px-3 py-2 rounded text-black"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
            >
              {t.save}
            </button>
          </form>

          {/* Tabla de inventario */}
          {inventory.length === 0 ? (
            <p className="opacity-80">{t.noData}</p>
          ) : (
            <table className="w-full bg-white/10 rounded-xl overflow-hidden">
              <thead className="bg-red-800">
                <tr>
                  <th className="p-2">{t.meatType}</th>
                  <th className="p-2">{t.weight}</th>
                  <th className="p-2">{t.date}</th>
                  <th className="p-2">{t.location}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700">
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.weight}</td>
                    <td className="p-2">{item.date}</td>
                    <td className="p-2">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
