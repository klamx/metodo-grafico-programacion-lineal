/**
 * Parses a linear expression like "3x1 + 2x2 - x3" or "3*x1 - 2*x2"
 * Returns { varName: coef } map
 */
function parseLinearExpr(exprStr) {
  const expr = exprStr.replace(/\s+/g, "").replace(/×/g, "*");
  const terms = {};
  // Match: optional sign/coef, optional *, variable name
  const termRe = /([+-]?\d*\.?\d*)\*?([a-zA-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = termRe.exec(expr)) !== null) {
    let coefStr = match[1];
    const varName = match[2].toLowerCase();
    // Skip "z", "f", common objective-label variables when on left side of =
    let coef;
    if (coefStr === "" || coefStr === "+") coef = 1;
    else if (coefStr === "-") coef = -1;
    else coef = parseFloat(coefStr);
    if (isNaN(coef)) coef = 1;
    terms[varName] = (terms[varName] || 0) + coef;
  }
  return terms;
}

/**
 * Parse objective function string.
 * Formats: "max z = 3x1 + 2x2", "maximizar z = ...", "min ...", "minimizar ..."
 * Returns { type, varTerms } or { error }
 */
export function parseObjective(str) {
  const s = str.trim().toLowerCase().replace(/×/g, "*");
  let type = null;
  let rest = s;

  if (/^maximizar/.test(s)) { type = "max"; rest = s.replace(/^maximizar/, "").trim(); }
  else if (/^max/.test(s)) { type = "max"; rest = s.replace(/^max/, "").trim(); }
  else if (/^minimizar/.test(s)) { type = "min"; rest = s.replace(/^minimizar/, "").trim(); }
  else if (/^min/.test(s)) { type = "min"; rest = s.replace(/^min/, "").trim(); }
  else return { error: 'Debe comenzar con "max" o "min" (ej: max z = 3x1 + 2x2)' };

  // Remove objective label like "z =", "f(x) =", "f ="
  rest = rest.replace(/^[a-zA-Z][a-zA-Z0-9()]*\s*=/, "").trim();

  const varTerms = parseLinearExpr(rest);
  if (Object.keys(varTerms).length === 0) {
    return { error: "No se encontraron variables en la función objetivo" };
  }

  return { type, varTerms };
}

/**
 * Parse a single constraint line like "2x1 + x2 <= 6"
 * Returns { varTerms, sign, rhs } or { error } or null if empty
 */
export function parseConstraintLine(str) {
  const s = str.trim().replace(/×/g, "*");
  if (!s) return null;

  let sign = null;
  let splitParts = null;

  if (s.includes("<=")) { sign = "<="; splitParts = s.split("<="); }
  else if (s.includes(">=")) { sign = ">="; splitParts = s.split(">="); }
  else if (s.includes("=")) { sign = "="; splitParts = s.split("="); }
  else return { error: `Restricción inválida: "${s}" — falta operador (<=, >=, =)` };

  if (splitParts.length !== 2) {
    return { error: `Restricción inválida: "${s}"` };
  }

  const lhs = splitParts[0].trim();
  const rhs = parseFloat(splitParts[1].trim());

  if (isNaN(rhs)) {
    return { error: `Valor RHS inválido en: "${s}"` };
  }

  const varTerms = parseLinearExpr(lhs);
  return { varTerms, sign, rhs };
}

/**
 * Parse full problem from text inputs.
 * Returns { objective, constraints, varNames, errors }
 */
export function parseProblem(objectiveText, constraintsText) {
  const errors = [];

  const objResult = parseObjective(objectiveText);
  if (objResult.error) errors.push(objResult.error);

  const lines = constraintsText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push("Ingresa al menos una restricción");
  }

  const parsedConstraints = [];
  lines.forEach((line) => {
    const result = parseConstraintLine(line);
    if (!result) return;
    if (result.error) errors.push(result.error);
    else parsedConstraints.push(result);
  });

  if (errors.length > 0) return { errors };

  // Collect all decision variable names (exclude obj label like z)
  const objVarNames = Object.keys(objResult.varTerms);
  const constraintVarNames = parsedConstraints.flatMap((c) => Object.keys(c.varTerms));
  const allVars = [...new Set([...objVarNames, ...constraintVarNames])];

  // Sort naturally: x1 < x2 < x10, then alphabetically
  const varNames = allVars.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  const objCoefficients = varNames.map((v) => objResult.varTerms[v] || 0);

  const constraints = parsedConstraints.map((c) => ({
    coefficients: varNames.map((v) => c.varTerms[v] || 0),
    sign: c.sign,
    rhs: c.rhs,
  }));

  return {
    objective: { type: objResult.type, coefficients: objCoefficients },
    constraints,
    varNames,
    errors: [],
  };
}
