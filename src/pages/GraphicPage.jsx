import { useLinearProgram } from "../hooks/useLinearProgram";
import ObjectiveFunctionForm from "../components/ObjectiveFunctionForm";
import ConstraintsForm from "../components/ConstraintsForm";
import FeasibleRegionChart from "../components/FeasibleRegionChart";
import VerticesTable from "../components/VerticesTable";
import OptimalSolution from "../components/OptimalSolution";
import styles from "./GraphicPage.module.css";

export default function GraphicPage() {
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
    <main className={styles.main}>
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
  );
}
