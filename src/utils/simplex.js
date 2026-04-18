/**
 * Simplex Method solver with full tableau tracking.
 * Handles maximization and minimization (converts min → max).
 * Supports <= constraints (adds slack), >= (subtracts surplus + adds artificial), = (adds artificial).
 * Uses Big-M method for artificial variables.
 *
 * objective: { type: "max"|"min", coefficients: number[] }
 * constraints: { coefficients: number[], sign: "<="|">="|"=", rhs: number }[]
 * decisionVarNames: string[] (e.g. ["x1","x2","x3"]) — optional, defaults to x1..xn
 */

const BIG_M = 1e6;

/**
 * Build initial simplex tableau.
 */
export function buildTableau(objective, constraints, decisionVarNames) {
  const numDecision = objective.coefficients.length;

  if (!decisionVarNames || decisionVarNames.length !== numDecision) {
    decisionVarNames = Array.from({ length: numDecision }, (_, i) => `x${i + 1}`);
  }

  const constraintTypes = constraints.map((c) => {
    if (c.sign === "<=") return "slack";
    if (c.sign === ">=") return "surplus+artificial";
    return "artificial";
  });

  const slackCount = constraintTypes.filter((t) => t === "slack").length;
  const surplusCount = constraintTypes.filter((t) => t === "surplus+artificial").length;
  const artificialCount =
    constraintTypes.filter((t) => t === "artificial").length + surplusCount;

  const numCols = numDecision + slackCount + surplusCount + artificialCount + 1;
  const totalVars = numDecision + slackCount + surplusCount + artificialCount;

  const varNames = [...decisionVarNames];
  for (let i = 0; i < slackCount; i++) varNames.push(`s${i + 1}`);
  for (let i = 0; i < surplusCount; i++) varNames.push(`e${i + 1}`);
  for (let i = 0; i < artificialCount; i++) varNames.push(`a${i + 1}`);

  const tableau = [];
  const basicVars = [];

  let slackIdx = numDecision;
  let surplusIdx = numDecision + slackCount;
  let artificialIdx = numDecision + slackCount + surplusCount;

  constraints.forEach((c, i) => {
    const row = new Array(numCols).fill(0);
    c.coefficients.forEach((coef, j) => { row[j] = coef; });
    row[numCols - 1] = c.rhs;

    const type = constraintTypes[i];
    if (type === "slack") {
      row[slackIdx] = 1;
      basicVars.push(slackIdx);
      slackIdx++;
    } else if (type === "surplus+artificial") {
      row[surplusIdx] = -1;
      row[artificialIdx] = 1;
      basicVars.push(artificialIdx);
      surplusIdx++;
      artificialIdx++;
    } else {
      row[artificialIdx] = 1;
      basicVars.push(artificialIdx);
      artificialIdx++;
    }

    tableau.push(row);
  });

  const isMax = objective.type === "max";
  const zRow = new Array(numCols).fill(0);
  objective.coefficients.forEach((coef, j) => {
    zRow[j] = isMax ? -coef : coef;
  });

  const artificialStart = numDecision + slackCount + surplusCount;
  for (let i = artificialStart; i < totalVars; i++) {
    zRow[i] = BIG_M;
  }
  tableau.push(zRow);

  basicVars.forEach((bv, i) => {
    if (bv >= artificialStart) {
      const coeff = tableau[tableau.length - 1][bv];
      if (Math.abs(coeff) > 1e-10) {
        for (let j = 0; j < numCols; j++) {
          tableau[tableau.length - 1][j] -= coeff * tableau[i][j];
        }
      }
    }
  });

  return { tableau, basicVars, varNames, numDecision, slackCount, surplusCount, artificialCount, numCols };
}

/**
 * Find pivot column: most negative coefficient in Z row.
 * Returns index or -1 if optimal.
 */
function findPivotCol(zRow) {
  let minVal = -1e-9;
  let col = -1;
  for (let j = 0; j < zRow.length - 1; j++) {
    if (zRow[j] < minVal) {
      minVal = zRow[j];
      col = j;
    }
  }
  return col;
}

/**
 * Find pivot row: minimum ratio test.
 * Returns index or -1 if unbounded.
 */
function findPivotRow(tableau, pivotCol) {
  const numRows = tableau.length - 1; // exclude Z row
  let minRatio = Infinity;
  let row = -1;
  for (let i = 0; i < numRows; i++) {
    const elem = tableau[i][pivotCol];
    if (elem > 1e-10) {
      const ratio = tableau[i][tableau[i].length - 1] / elem;
      if (ratio < minRatio - 1e-10) {
        minRatio = ratio;
        row = i;
      }
    }
  }
  return row;
}

/**
 * Perform pivot operation. Mutates tableau in place.
 */
function pivot(tableau, pivotRow, pivotCol) {
  const numCols = tableau[0].length;
  const pivotElem = tableau[pivotRow][pivotCol];

  // Normalize pivot row
  for (let j = 0; j < numCols; j++) {
    tableau[pivotRow][j] /= pivotElem;
  }

  // Eliminate pivot column in all other rows
  for (let i = 0; i < tableau.length; i++) {
    if (i === pivotRow) continue;
    const factor = tableau[i][pivotCol];
    if (Math.abs(factor) < 1e-12) continue;
    for (let j = 0; j < numCols; j++) {
      tableau[i][j] -= factor * tableau[pivotRow][j];
    }
  }
}

/**
 * Deep copy 2D array.
 */
function copyTableau(t) {
  return t.map((row) => [...row]);
}

/**
 * Solve LP using simplex. Returns { iterations, status, optimalZ, variables }
 * objective: { type, coefficients }
 * constraints: [{ coefficients, sign, rhs }]
 * decisionVarNames: optional string[]
 */
export function solveSimplex(objective, constraints, decisionVarNames) {
  if (constraints.length === 0) {
    return { status: "infeasible", iterations: [], optimalZ: null, variables: null };
  }

  let { tableau, basicVars, varNames, numDecision, slackCount, surplusCount, artificialCount, numCols } =
    buildTableau(objective, constraints, decisionVarNames);

  const iterations = [];
  const isMax = objective.type === "max";
  const artificialStart = numDecision + slackCount + surplusCount;

  // Initial tableau snapshot
  iterations.push({
    tableau: copyTableau(tableau),
    basicVars: [...basicVars],
    pivotRow: null,
    pivotCol: null,
    zValue: isMax ? tableau[tableau.length - 1][numCols - 1] : -tableau[tableau.length - 1][numCols - 1],
    operation: "Tableau Inicial — Fase II",
  });

  const MAX_ITER = 50;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const zRow = tableau[tableau.length - 1];
    const pivotCol = findPivotCol(zRow);
    if (pivotCol === -1) break; // optimal

    const pivotRow = findPivotRow(tableau, pivotCol);
    if (pivotRow === -1) {
      return { status: "unbounded", iterations, optimalZ: null, variables: null };
    }

    // Record before pivot
    const enteringVar = varNames[pivotCol];
    const leavingVar = varNames[basicVars[pivotRow]];

    pivot(tableau, pivotRow, pivotCol);
    basicVars[pivotRow] = pivotCol;

    iterations.push({
      tableau: copyTableau(tableau),
      basicVars: [...basicVars],
      pivotRow,
      pivotCol,
      zValue: isMax ? tableau[tableau.length - 1][numCols - 1] : -tableau[tableau.length - 1][numCols - 1],
      operation: `Entra: ${enteringVar} · Sale: ${leavingVar}`,
    });
  }

  // Check feasibility: if any artificial is basic with value > epsilon, infeasible
  const numRows = tableau.length - 1;
  for (let i = 0; i < numRows; i++) {
    if (basicVars[i] >= artificialStart) {
      const val = tableau[i][numCols - 1];
      if (Math.abs(val) > 1e-6) {
        return { status: "infeasible", iterations, optimalZ: null, variables: null };
      }
    }
  }

  // Extract solution
  // Z[RHS] accumulates the actual objective value after pivoting.
  // For max: zRow was set with -coef, so Z[RHS] = +obj_value.
  // For min: zRow was set with +coef (negated obj), so Z[RHS] = -obj_value.
  const rawZ = tableau[tableau.length - 1][numCols - 1];
  const optimalZ = isMax ? rawZ : -rawZ;

  const variables = {};
  varNames.forEach((name, idx) => {
    variables[name] = 0;
  });
  for (let i = 0; i < numRows; i++) {
    variables[varNames[basicVars[i]]] = tableau[i][numCols - 1];
  }

  return {
    status: "optimal",
    iterations,
    optimalZ,
    variables,
    varNames,
    numDecision,
    slackCount,
    surplusCount,
    artificialCount,
  };
}
