import { useState, useCallback, useMemo } from "react";
import { solveLinearProgram } from "../utils/linearProgramming";

const DEFAULT_OBJECTIVE = { cx: 3, cy: 5, type: "max" };

const DEFAULT_CONSTRAINTS = [
  { id: 1, cx: 1, cy: 2, sign: "<=", rhs: 10 },
  { id: 2, cx: 3, cy: 1, sign: "<=", rhs: 15 },
  { id: 3, cx: 2, cy: 2, sign: "<=", rhs: 12 },
  { id: 4, cx: 1, cy: 0, sign: ">=", rhs: 0 },
  { id: 5, cx: 0, cy: 1, sign: ">=", rhs: 0 },
];

let nextId = 6;

export function useLinearProgram() {
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [solved, setSolved] = useState(false);
  const [result, setResult] = useState(null);

  const updateObjective = useCallback((field, value) => {
    setObjective((prev) => ({ ...prev, [field]: value }));
    setSolved(false);
  }, []);

  const addConstraint = useCallback(() => {
    setConstraints((prev) => [
      ...prev,
      { id: nextId++, cx: 1, cy: 1, sign: "<=", rhs: 10 },
    ]);
    setSolved(false);
  }, []);

  const updateConstraint = useCallback((id, field, value) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setSolved(false);
  }, []);

  const removeConstraint = useCallback((id) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
    setSolved(false);
  }, []);

  const solve = useCallback(() => {
    // Convertir todos los valores a número antes de resolver
    const numericConstraints = constraints.map((c) => ({
      ...c,
      cx: Number(c.cx),
      cy: Number(c.cy),
      rhs: Number(c.rhs),
    }));
    const numericObjective = {
      cx: Number(objective.cx),
      cy: Number(objective.cy),
      type: objective.type,
    };
    const solution = solveLinearProgram(numericObjective, numericConstraints);
    setResult(solution);
    setSolved(true);
  }, [objective, constraints]);

  const reset = useCallback(() => {
    setObjective(DEFAULT_OBJECTIVE);
    setConstraints(DEFAULT_CONSTRAINTS);
    setSolved(false);
    setResult(null);
  }, []);

  const numericConstraints = useMemo(
    () =>
      constraints.map((c) => ({
        ...c,
        cx: Number(c.cx),
        cy: Number(c.cy),
        rhs: Number(c.rhs),
      })),
    [constraints]
  );

  const numericObjective = useMemo(
    () => ({
      cx: Number(objective.cx),
      cy: Number(objective.cy),
      type: objective.type,
    }),
    [objective]
  );

  return {
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
  };
}
