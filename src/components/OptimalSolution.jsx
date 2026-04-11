import styles from "./OptimalSolution.module.css";

export default function OptimalSolution({ result, objective }) {
  if (!result) return null;

  if (!result.feasible) {
    return (
      <div className={`${styles.card} ${styles.infeasible}`}>
        <h3 className={styles.title}>⚠️ Sin Solución</h3>
        <p className={styles.message}>
          No existe región factible con las restricciones actuales. Revisa las restricciones ingresadas.
        </p>
      </div>
    );
  }

  const { optimalVertex, optimalZ } = result;
  const typeLabel = objective.type === "max" ? "Máximo" : "Mínimo";

  return (
    <div className={`${styles.card} ${styles.feasible}`}>
      <div className={styles.header}>
        <span className={styles.trophy}>🏆</span>
        <h3 className={styles.title}>Solución Óptima</h3>
      </div>

      <div className={styles.pointRow}>
        <span className={styles.pointLabel}>Punto óptimo</span>
        <span className={styles.pointValue}>
          ({optimalVertex.x.toFixed(4)}, {optimalVertex.y.toFixed(4)})
        </span>
      </div>

      <div className={styles.zRow}>
        <span className={styles.zLabel}>Valor {typeLabel}</span>
        <span className={styles.zValue}>
          z = {optimalZ.toFixed(4)}
        </span>
      </div>

      <div className={styles.details}>
        <span className={styles.detailItem}>x = {optimalVertex.x.toFixed(4)}</span>
        <span className={styles.separator}>·</span>
        <span className={styles.detailItem}>y = {optimalVertex.y.toFixed(4)}</span>
      </div>
    </div>
  );
}
