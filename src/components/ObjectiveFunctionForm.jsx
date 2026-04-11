import styles from "./ObjectiveFunctionForm.module.css";

export default function ObjectiveFunctionForm({ objective, onUpdate }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Función Objetivo</h2>
      <p className={styles.subtitle}>Z = cx·x + cy·y</p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Coeficiente X (cx)</label>
          <input
            type="number"
            value={objective.cx}
            onChange={(e) => onUpdate("cx", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Coeficiente Y (cy)</label>
          <input
            type="number"
            value={objective.cy}
            onChange={(e) => onUpdate("cy", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Tipo</label>
          <select
            value={objective.type}
            onChange={(e) => onUpdate("type", e.target.value)}
          >
            <option value="max">Maximizar</option>
            <option value="min">Minimizar</option>
          </select>
        </div>
      </div>

      <div className={styles.preview}>
        <span className={styles.badge}>
          {objective.type === "max" ? "Maximizar" : "Minimizar"} Z ={" "}
          {objective.cx}x + {objective.cy}y
        </span>
      </div>
    </div>
  );
}
