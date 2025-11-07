import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Temporarily removed StrictMode to debug hook ordering issue
createRoot(document.getElementById("root")).render(<App />);
