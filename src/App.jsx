
import React, { useState, useEffect } from "react";
import "./index.css";
import "./i18n";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const { t, i18n } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [inventory, setInventory] = useState([]);
  const [product, setProduct] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("Cooler General");

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("inventory")) || [];
    setInventory(savedData);
  }, []);

  const handleLogin = () => {
    if (password === "Morchione0506@") {
      setIsLoggedIn(true);
      toast.success("✅ Access Granted");
    } else {
      toast.error(t("errorPass"));
    }
  };

  const handleAddItem = () => {
    if (!product || !weight) return;
    const newItem = {
      id: Date.now(),
      product,
      weight,
      location,
      date: new Date().toLocaleString(),
    };
    const updated = [...inventory, newItem];
    setInventory(updated);
    localStorage.setItem("inventory", JSON.stringify(updated));
    setProduct("");
    setWeight("");
    toast.success(t("successAdd"));
  };

  const handleDelete = (id) => {
    const updated = inventory.filter((item) => item.id !== id);
    setInventory(updated);
    localStorage.setItem("inventory", JSON.stringify(updated));
  };

  const handleBackup = () => {
    const blob = new Blob([JSON.stringify(inventory, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_backup_${new Date()
      .toISOString()
      .slice(0, 19)}.json`;
    a.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = JSON.parse(evt.target.result);
      setInventory(data);
      localStorage.setItem("inventory", JSON.stringify(data));
      toast.info("📦 Datos restaurados");
    };
    reader.readAsText(file);
  };

  const changeLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark text-gray-100">
        <h1 className="text-3xl font-bold mb-6">{t("login")}</h1>
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800 text-white mb-3 border border-gray-600"
        />
        <button
          onClick={handleLogin}
          className="bg-primary hover:bg-blue-700 px-4 py-2 rounded"
        >
          {t("access")}
        </button>
        <ToastContainer position="bottom-center" theme="dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={changeLanguage}
            className="bg-primary px-3 py-1 rounded"
          >
            🌐 {t("language")}
          </button>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="bg-red-600 px-3 py-1 rounded"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder={t("product")}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="number"
          placeholder={t("weight")}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        >
          <option>Cooler General</option>
          <option>128 Erie St S</option>
          <option>10 Mill St W</option>
        </select>
      </div>

      <button
        onClick={handleAddItem}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mb-6"
      >
        {t("addItem")}
      </button>

      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-700">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">{t("product")}</th>
              <th className="p-2">{t("weight")}</th>
              <th className="p-2">{t("location")}</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">{t("delete")}</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={item.id} className="border-t border-gray-700">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{item.product}</td>
                <td className="p-2">{item.weight}</td>
                <td className="p-2">{item.location}</td>
                <td className="p-2">{item.date}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleBackup}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {t("backup")}
        </button>
        <label className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded cursor-pointer">
          {t("restore")}
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            className="hidden"
          />
        </label>
      </div>

      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
