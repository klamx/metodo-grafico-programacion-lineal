import styles from "./SimplexSolution.module.css";

function fmt(val) {
  if (Math.abs(val) < 1e-9) return "0";
  if (Number.isInteger(val)) return String(val);
  return val.toFixed(4);
}

export default function SimplexSolution({ result }) {
  if (!result) return null;

  if (result.status === "infeasible" || result.status === "unbounded") return null;

  const { optimalZ, variables, varNames, numDecision } = result;
  const typeLabel = result.objectiveType === "min" ? "Minimización" : "Maximización";

  // Show only decision variables (first numDecision from varNames, or all that don't start with s/e/a)
  const decisionVarNames = varNames
    ? varNames.slice(0, numDecision)
    : Object.keys(variables).filter((n) => /^x\d*$/.test(n));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.trophy}>🏆</span>
        <div>
          <h3 className={styles.title}>Solución Óptima</h3>
          <span className={styles.typeBadge}>{typeLabel}</span>
        </div>
      </div>

      <div className={styles.zRow}>
        <span className={styles.zLabel}>Z óptimo =</span>
        <span className={styles.zValue}>{fmt(optimalZ)}</span>
      </div>

      <div className={styles.varSection}>
        <p className={styles.varTitle}>📌 Valores de las Variables:</p>
        <table className={styles.varTable}>
          <tbody>
            {decisionVarNames.map((name) => (
              <tr key={name}>
                <td className={styles.varName}>{name}</td>
                <td className={styles.varVal}>{fmt(variables[name] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
