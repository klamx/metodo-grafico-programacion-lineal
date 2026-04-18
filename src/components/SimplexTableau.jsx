import { useState } from "react";
import styles from "./SimplexTableau.module.css";

function fmt(val) {
  if (Math.abs(val) < 1e-9) return "0";
  if (Number.isInteger(val)) return String(val);
  return val.toFixed(2);
}

function TableauIteration({ iter, index, varNames, total, artificialStart }) {
  const [open, setOpen] = useState(index === 0);
  const tableau = iter.tableau;
  const numRows = tableau.length - 1;
  const numCols = tableau[0].length;
  const zRow = tableau[numRows];
  const zVal = iter.zValue;

  const isInitial = index === 0;
  const isOptimal = index === total - 1;

  return (
    <div className={`${styles.iteration} ${isOptimal ? styles.optimalIter : ""}`}>
      <button className={styles.iterHeader} onClick={() => setOpen((v) => !v)}>
        <div className={styles.iterLeft}>
          {isOptimal ? "🏆" : isInitial ? "📋" : "🔄"}
          <span className={styles.iterLabel}>
            {isInitial
              ? "Tableau Inicial (Iteración 0)"
              : isOptimal
                ? `Solución Óptima (Iteración ${index})`
                : `Iteración ${index}`}
          </span>
          <span className={styles.zBadge}>Z = {fmt(zVal)}</span>
        </div>
        <span className={styles.chevron}>{open ? "∧" : "∨"}</span>
      </button>

      {open && (
        <div className={styles.iterBody}>
          {iter.operation && (
            <div className={styles.opNote}>
              <span className={styles.opDot} />
              <span className={styles.opText}>
                <strong>Operación:</strong> {iter.operation}
              </span>
            </div>
          )}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>BASE</th>
                  {varNames.map((name, j) => (
                    <th
                      key={j}
                      className={`${styles.th} ${iter.pivotCol === j ? styles.pivotCol : ""
                        } ${j >= artificialStart ? styles.artificialCol : ""}`}
                    >
                      {name}
                    </th>
                  ))}
                  <th className={styles.th}>RHS</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numRows }).map((_, i) => {
                  const basicVarName = varNames[iter.basicVars[i]] ?? "?";
                  const isPivotRow = iter.pivotRow === i;
                  return (
                    <tr
                      key={i}
                      className={`${isPivotRow ? styles.pivotRow : ""}`}
                    >
                      <td className={`${styles.td} ${styles.baseCell}`}>
                        {basicVarName}
                      </td>
                      {Array.from({ length: numCols - 1 }).map((_, j) => (
                        <td
                          key={j}
                          className={`${styles.td} ${iter.pivotCol === j ? styles.pivotCol : ""
                            } ${isPivotRow && iter.pivotCol === j
                              ? styles.pivotElem
                              : ""
                            }`}
                        >
                          {fmt(tableau[i][j])}
                        </td>
                      ))}
                      <td className={`${styles.td} ${styles.rhsCell}`}>
                        {fmt(tableau[i][numCols - 1])}
                      </td>
                    </tr>
                  );
                })}
                <tr className={styles.zRowTr}>
                  <td className={`${styles.td} ${styles.baseCell}`}>Z</td>
                  {Array.from({ length: numCols - 1 }).map((_, j) => (
                    <td
                      key={j}
                      className={`${styles.td} ${styles.zCell} ${iter.pivotCol === j ? styles.pivotCol : ""
                        }`}
                    >
                      {fmt(zRow[j])}
                    </td>
                  ))}
                  <td className={`${styles.td} ${styles.zCell} ${styles.rhsCell}`}>
                    {fmt(zRow[numCols - 1])}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.basicVars}>
            <span className={styles.basicLabel}>Variables Básicas Actuales:</span>
            {iter.basicVars.map((bv, i) => (
              <span key={i} className={`${styles.basicBadge} ${bv >= artificialStart ? styles.artificialBadge : ""}`}>
                {varNames[bv] ?? "?"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimplexTableau({ result }) {
  if (!result) return null;

  const { iterations, status, optimalZ, variables, varNames, numDecision, slackCount, surplusCount } = result;

  if (status === "infeasible") {
    return (
      <div className={`${styles.card} ${styles.infeasible}`}>
        <h3 className={styles.statusTitle}>⚠️ Sin Solución Factible</h3>
        <p className={styles.statusMsg}>
          Las restricciones no tienen región factible. Revisa los valores ingresados.
        </p>
      </div>
    );
  }

  if (status === "unbounded") {
    return (
      <div className={`${styles.card} ${styles.infeasible}`}>
        <h3 className={styles.statusTitle}>∞ Solución No Acotada</h3>
        <p className={styles.statusMsg}>
          La función objetivo crece sin límite. Verifica que las restricciones sean correctas.
        </p>
      </div>
    );
  }

  const artificialStart = numDecision + slackCount + surplusCount;
  const numIter = iterations.length - 1;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <h3 className={styles.cardTitle}>📊 Tableau Paso a Paso</h3>
          <span className={styles.iterCount}>{numIter} iteraciones</span>
        </div>
        <p className={styles.hint}>
          💡 Propósito educativo: Se muestra cada iteración del método Simplex con su tableau completo. Las columnas y filas pivote se resaltan para facilitar el aprendizaje.
        </p>
      </div>

      <div className={styles.iterations}>
        {iterations.map((iter, i) => (
          <TableauIteration
            key={i}
            iter={iter}
            index={i}
            total={iterations.length}
            varNames={varNames}
            artificialStart={artificialStart}
          />
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>🔢 Total de Iteraciones</span>
          <span className={styles.summaryValue}>{numIter}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>🎯 Valor Óptimo</span>
          <span className={styles.summaryValue}>{fmt(optimalZ)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>✅ Estado Final</span>
          <span className={`${styles.summaryBadge} ${styles.optimalBadge}`}>Óptimo</span>
        </div>
      </div>
    </div>
  );
}
