import styles from "./VerticesTable.module.css";

export default function VerticesTable({ vertices, optimalVertex, objectiveType }) {
  if (!vertices || vertices.length === 0) return null;

  const sorted = [...vertices].sort((a, b) =>
    objectiveType === "max" ? b.z - a.z : a.z - b.z
  );

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>📍 Vértices de la Región Factible</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Vértice</th>
            <th>Valor Z</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => {
            const isOptimal =
              optimalVertex &&
              Math.abs(v.x - optimalVertex.x) < 1e-6 &&
              Math.abs(v.y - optimalVertex.y) < 1e-6;

            return (
              <tr key={i} className={isOptimal ? styles.optimal : ""}>
                <td>
                  ({v.x.toFixed(4)}, {v.y.toFixed(4)}){" "}
                  {isOptimal && <span className={styles.star}>★</span>}
                </td>
                <td className={styles.zValue}>{v.z.toFixed(4)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
