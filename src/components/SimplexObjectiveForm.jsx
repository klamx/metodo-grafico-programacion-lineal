import styles from "./SimplexObjectiveForm.module.css";

export default function SimplexObjectiveForm({ objective, onUpdate }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Función Objetivo</h2>
        <select
          className={styles.typeSelect}
          value={objective.type}
          onChange={(e) => onUpdate("type", e.target.value)}
        >
          <option value="max">Maximizar</option>
          <option value="min">Minimizar</option>
        </select>
      </div>
      <p className={styles.subtitle}>Z = c₁·x₁ + c₂·x₂</p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>c₁ (x₁)</label>
          <input
            type="number"
            className={styles.input}
            value={objective.cx}
            onChange={(e) => onUpdate("cx", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>c₂ (x₂)</label>
          <input
            type="number"
            className={styles.input}
            value={objective.cy}
            onChange={(e) => onUpdate("cy", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.preview}>
        Z = {objective.cx}·x₁ + {objective.cy}·x₂
      </div>
    </div>
  );
}
