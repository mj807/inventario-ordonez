import React from "react";

export default function Login({ onLogin, language, setLanguage, texts }) {
  const t = texts[language];

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = e.target.user.value;
    const pass = e.target.pass.value;
    onLogin(user, pass);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(to bottom right, rgba(17,24,39,0.7), rgba(76,29,29,0.35), rgba(17,24,39,0.7))",
        zIndex: 9999,
        paddingBottom: "200px",
      }}
    >
      <div className="flex flex-col items-center gap-0">
        <img
          src="/OrdLogo.png"
          alt="Logo"
          style={{
            width: 500,
            height: "auto",
            display: "block",
            margin: "0 auto -150px",
            position: "relative",
            zIndex: 1,
          }}
          className="object-contain"
        />

        <div
          className="w-80 bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-5 text-white relative z-50"
          style={{ marginLeft: "130px", zIndex: 100 }}
        >
          <div className="text-center mb-3">
            <h1 className="text-xl font-semibold leading-tight">
              Ordoñez Group
            </h1>
            <p
              className="text-sm text-white/70 leading-tight inline-block"
              style={{ marginLeft: "30px" }}
            >
              Butcher Management
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div
              style={{ marginRight: "70px", position: "relative", zIndex: 200 }}
            >
              <input
                name="user"
                placeholder={t.username}
                className="w-full px-4 py-2 text-sm rounded-full bg-white/10 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoComplete="username"
                style={{
                  pointerEvents: "auto",
                  position: "relative",
                  zIndex: 200,
                }}
              />
            </div>

            <div
              style={{ marginRight: "70px", position: "relative", zIndex: 200 }}
            >
              <input
                name="pass"
                type="password"
                placeholder={t.password}
                className="w-full px-4 py-2 text-sm rounded-full bg-white/10 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoComplete="current-password"
                style={{
                  pointerEvents: "auto",
                  position: "relative",
                  zIndex: 200,
                }}
              />
            </div>

            <div
              className="flex items-center justify-between gap-2 mt-1"
              style={{ marginLeft: "50px" }}
            >
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                {t.login}
              </button>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/10 text-white border border-white/10 rounded px-1 py-1 text-xs"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>
          </form>

          <p className="text-[10px] text-white/50 mt-3 text-center">
            © 2025 Ordoñez Group Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
