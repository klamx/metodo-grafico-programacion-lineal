import { useLinearProgram } from "./hooks/useLinearProgram";
import ObjectiveFunctionForm from "./components/ObjectiveFunctionForm";
import ConstraintsForm from "./components/ConstraintsForm";
import FeasibleRegionChart from "./components/FeasibleRegionChart";
import VerticesTable from "./components/VerticesTable";
import OptimalSolution from "./components/OptimalSolution";
import styles from "./App.module.css";

export default function App() {
  const {
    objective,
    constraints,
    solved,
    result,
    numericConstraints,
    numericObjective,
    updateObjective,
    addConstraint,
    updateConstraint,
    removeConstraint,
    solve,
    reset,
  } = useLinearProgram();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Programación Lineal</h1>
          <p className={styles.subtitle}>Método Gráfico</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Left column: inputs */}
        <aside className={styles.sidebar}>
          <ObjectiveFunctionForm
            objective={objective}
            onUpdate={updateObjective}
          />

          <ConstraintsForm
            constraints={constraints}
            onAdd={addConstraint}
            onUpdate={updateConstraint}
            onRemove={removeConstraint}
          />

          <div className={styles.actions}>
            <button className={styles.solveBtn} onClick={solve}>
              ▶ Resolver
            </button>
            <button className={styles.resetBtn} onClick={reset}>
              ↺ Resetear
            </button>
          </div>
        </aside>

        {/* Right column: results */}
        <section className={styles.results}>
          {solved && result && (
            <OptimalSolution result={result} objective={numericObjective} />
          )}

          <FeasibleRegionChart
            constraints={numericConstraints}
            vertices={solved && result?.feasible ? result.vertices : []}
            optimalVertex={solved && result?.feasible ? result.optimalVertex : null}
            objective={numericObjective}
          />

          {solved && result?.feasible && (
            <VerticesTable
              vertices={result.vertices}
              optimalVertex={result.optimalVertex}
              objectiveType={numericObjective.type}
            />
          )}
        </section>
      </main>
    </div>
  );
}
