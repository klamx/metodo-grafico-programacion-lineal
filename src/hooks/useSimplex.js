import { useState, useCallback } from "react";
import { solveSimplex } from "../utils/simplex";
import { parseProblem } from "../utils/simplexParser";

const EXAMPLE_OBJECTIVE = "max z = 3x1 + 2x2";
const EXAMPLE_CONSTRAINTS = `x1 + x2 <= 4
3x1 + x2 <= 5
x1 >= 0
x2 >= 0`;

export function useSimplex() {
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
    const solution = solveSimplex(
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
