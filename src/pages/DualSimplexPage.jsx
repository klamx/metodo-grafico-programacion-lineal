import { useDualSimplex } from "../hooks/useDualSimplex";
import SimplexInputForm from "../components/SimplexInputForm";
import SimplexSolution from "../components/SimplexSolution";
import SimplexTableau from "../components/SimplexTableau";
import styles from "./DualSimplexPage.module.css";

export default function DualSimplexPage() {
  const {
    objectiveText,
    constraintsText,
    solved,
    result,
    parseErrors,
    setObjectiveText,
    setConstraintsText,
    solve,
    reset,
    loadExample,
  } = useDualSimplex();

  const showError =
    solved &&
    result &&
    (result.status === "not-dual-feasible" || result.status === "invalid");

  return (
    <main className={styles.main}>
      <aside className={styles.sidebar}>
        <SimplexInputForm
          objectiveText={objectiveText}
          constraintsText={constraintsText}
          parseErrors={parseErrors}
          onObjectiveChange={setObjectiveText}
          onConstraintsChange={setConstraintsText}
          onSolve={solve}
          onReset={reset}
          onLoadExample={loadExample}
          solveLabel="🔁 Resolver con Simplex Dual"
          constraintsHint="Solo <= y >=. Una restricción por línea."
        />
      </aside>

      <section className={styles.results}>
        {showError && (
          <div className={styles.errorCard}>
            <span className={styles.errorIcon}>⚠️</span>
            <div>
              <strong>No se puede aplicar Simplex Dual</strong>
              <p>{result.message}</p>
            </div>
          </div>
        )}

        {solved && result && !showError && (
          <SimplexSolution result={result} />
        )}
        {solved && result && !showError && (
          <SimplexTableau result={result} />
        )}
      </section>
    </main>
  );
}
