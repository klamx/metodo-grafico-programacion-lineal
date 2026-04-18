import styles from "./SimplexConstraintsForm.module.css";

const SIGN_OPTIONS = ["<=", ">=", "="];

function ConstraintRow({ constraint, onUpdate, onRemove, index }) {
  return (
    <div className={styles.row}>
      <span className={styles.index}>{index + 1}</span>
      <input
        type="number"
        className={styles.coefInput}
        value={constraint.cx}
        onChange={(e) => onUpdate(constraint.id, "cx", e.target.value)}
        title="Coeficiente de x₁"
      />
      <span className={styles.varLabel}>x₁ +</span>
      <input
        type="number"
        className={styles.coefInput}
        value={constraint.cy}
        onChange={(e) => onUpdate(constraint.id, "cy", e.target.value)}
        title="Coeficiente de x₂"
      />
      <span className={styles.varLabel}>x₂</span>
      <select
        className={styles.signSelect}
        value={constraint.sign}
        onChange={(e) => onUpdate(constraint.id, "sign", e.target.value)}
      >
        {SIGN_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="number"
        className={styles.rhsInput}
        value={constraint.rhs}
        onChange={(e) => onUpdate(constraint.id, "rhs", e.target.value)}
        title="Lado derecho"
      />
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(constraint.id)}
        title="Eliminar"
      >
        ✕
      </button>
    </div>
  );
}

export default function SimplexConstraintsForm({ constraints, onAdd, onUpdate, onRemove }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Restricciones</h2>
          <p className={styles.subtitle}>c₁·x₁ + c₂·x₂ ≤ / ≥ / = rhs</p>
        </div>
        <button className={styles.addBtn} onClick={onAdd}>+ Agregar</button>
      </div>

      <div className={styles.labels}>
        <span style={{ width: 24 }} />
        <span className={styles.labelText}>c₁</span>
        <span style={{ width: 36 }} />
        <span className={styles.labelText}>c₂</span>
        <span style={{ width: 28 }} />
        <span className={styles.labelText}>Signo</span>
        <span className={styles.labelText}>rhs</span>
      </div>

      <div className={styles.list}>
        {constraints.map((c, i) => (
          <ConstraintRow
            key={c.id}
            constraint={c}
            index={i}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
