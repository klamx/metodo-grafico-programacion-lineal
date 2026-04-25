import { useState, useCallback } from "react";
import { solveDualSimplex } from "../utils/dualSimplex";
import { parseProblem } from "../utils/simplexParser";

const EXAMPLE_OBJECTIVE = "min z = 2x1 + 3x2";
const EXAMPLE_CONSTRAINTS = `x1 + x2 >= 4
x1 + 3x2 >= 6`;

export function useDualSimplex() {
  const [objectiveText, setObjectiveText] = useState(EXAMPLE_OBJECTIVE);
  const [constraintsText, setConstraintsText] = useState(EXAMPLE_CONSTRAINTS);
  const [solved, setSolved] = useState(false);
  const [result, setResult] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);

  const solve = useCallback(() => {
    const parsed = parseProblem(objectiveText, constraintsText);
    if (parsed.errors && parsed.errors.length > 0) {
      setParseErrors(parsed.errors);
      setSolved(false);
      setResult(null);
      return;
    }
    setParseErrors([]);
    const solution = solveDualSimplex(
      parsed.objective,
      parsed.constraints,
      parsed.varNames
    );
    setResult({ ...solution, varNames: parsed.varNames, objectiveType: parsed.objective.type });
    setSolved(true);
  }, [objectiveText, constraintsText]);

  const reset = useCallback(() => {
    setObjectiveText("");
    setConstraintsText("");
    setSolved(false);
    setResult(null);
    setParseErrors([]);
  }, []);

  const loadExample = useCallback(() => {
    setObjectiveText(EXAMPLE_OBJECTIVE);
    setConstraintsText(EXAMPLE_CONSTRAINTS);
    setSolved(false);
    setResult(null);
    setParseErrors([]);
  }, []);

  return {
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
  };
}
