import { useSimplex } from "../hooks/useSimplex";
import SimplexInputForm from "../components/SimplexInputForm";
import SimplexSolution from "../components/SimplexSolution";
import SimplexTableau from "../components/SimplexTableau";
import styles from "./SimplexPage.module.css";

export default function SimplexPage() {
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
  } = useSimplex();

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
        />
      </aside>

      <section className={styles.results}>
        {solved && result && (
          <SimplexSolution result={result} />
        )}
        {solved && result && (
          <SimplexTableau result={result} />
        )}
      </section>
    </main>
  );
}
