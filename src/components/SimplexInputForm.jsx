import styles from "./SimplexInputForm.module.css";

export default function SimplexInputForm({
  objectiveText,
  constraintsText,
  parseErrors,
  onObjectiveChange,
  onConstraintsChange,
  onSolve,
  onReset,
  onLoadExample,
  solveLabel = "📊 Resolver con Simplex",
  constraintsHint,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.headerIcon}>✏️</span>
        <h2 className={styles.headerTitle}>Ingresa tu problema</h2>
      </div>

      <div className={styles.body}>
        {/* Objective */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🎯</span>
            <span className={styles.sectionTitle}>Función Objetivo</span>
            <span className={styles.helpBadge} title="Formatos soportados">?</span>
          </div>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Ejemplo: maximizar z = 3x1 + 2x2 + x3"
            value={objectiveText}
            onChange={(e) => onObjectiveChange(e.target.value)}
            spellCheck={false}
          />
          <p className={styles.hint}>
            ℹ️ Formatos: <code>"max z = 3x1 + 2x2"</code> o <code>"min z = 5x1 + 4x2 + 3x3"</code>
          </p>
        </div>

        {/* Constraints */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>≡</span>
            <span className={styles.sectionTitle}>Restricciones</span>
            <span className={styles.helpBadge} title="Una restricción por línea">?</span>
          </div>
          <textarea
            className={styles.textarea}
            placeholder={`Una restricción por línea:\n\nx1 + x2 <= 4\n2x1 + x2 <= 6\nx1 >= 0\nx2 >= 0`}
            value={constraintsText}
            onChange={(e) => onConstraintsChange(e.target.value)}
            rows={7}
            spellCheck={false}
          />
          <p className={styles.hint}>ℹ️ {constraintsHint ?? "Operadores válidos: <=, >=, ="}</p>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className={styles.errors}>
            {parseErrors.map((err, i) => (
              <p key={i} className={styles.errorItem}>⚠️ {err}</p>
            ))}
          </div>
        )}

        {/* Solve button */}
        <button className={styles.solveBtn} onClick={onSolve}>
          {solveLabel}
        </button>

        {/* Secondary actions */}
        <div className={styles.secondaryActions}>
          <button className={styles.secondaryBtn} onClick={onReset}>
            🗑️ Limpiar
          </button>
          <button className={styles.exampleBtn} onClick={onLoadExample}>
            💡 Cargar Ejemplo
          </button>
        </div>
      </div>
    </div>
  );
}
