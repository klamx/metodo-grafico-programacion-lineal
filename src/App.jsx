import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GraphicPage from "./pages/GraphicPage";
import SimplexPage from "./pages/SimplexPage";
import DualSimplexPage from "./pages/DualSimplexPage";
import styles from "./App.module.css";

const METHOD_LABELS = {
  "/grafico": "Método Gráfico",
  "/simplex": "Método Simplex",
  "/simplex-dual": "Simplex Dual",
};

function Header() {
  const location = useLocation();
  const methodLabel = METHOD_LABELS[location.pathname];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <NavLink to="/" className={styles.brand}>
          Programación Lineal
        </NavLink>
        {methodLabel && (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.methodLabel}>{methodLabel}</span>
          </>
        )}
        <nav className={styles.nav}>
          <NavLink
            to="/grafico"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navActive : ""}`
            }
          >
            📈 Gráfico
          </NavLink>
          <NavLink
            to="/simplex"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navActive : ""}`
            }
          >
            🔢 Simplex
          </NavLink>
          <NavLink
            to="/simplex-dual"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navActive : ""}`
            }
          >
            🔄 Dual
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/grafico" element={<GraphicPage />} />
          <Route path="/simplex" element={<SimplexPage />} />
          <Route path="/simplex-dual" element={<DualSimplexPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
