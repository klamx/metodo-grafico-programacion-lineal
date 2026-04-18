import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

const METHODS = [
  {
    path: "/grafico",
    icon: "📈",
    title: "Método Gráfico",
    description:
      "Resuelve problemas de programación lineal con 2 variables visualizando la región factible y los vértices.",
    tags: ["2 variables", "Gráfico", "Visual"],
  },
  {
    path: "/simplex",
    icon: "🔢",
    title: "Método Simplex",
    description:
      "Algoritmo iterativo para n variables. Muestra el tableau completo paso a paso con variables básicas y pivotes.",
    tags: ["n variables", "Tableau", "Iterativo"],
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h2 className={styles.heroTitle}>Elige un Método</h2>
        <p className={styles.heroSub}>
          Selecciona el método que quieres usar para resolver tu problema de programación lineal.
        </p>
      </div>

      <div className={styles.grid}>
        {METHODS.map((m) => (
          <button
            key={m.path}
            className={styles.card}
            onClick={() => navigate(m.path)}
          >
            <span className={styles.icon}>{m.icon}</span>
            <h3 className={styles.cardTitle}>{m.title}</h3>
            <p className={styles.cardDesc}>{m.description}</p>
            <div className={styles.tags}>
              {m.tags.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
            <span className={styles.cta}>Usar método →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
