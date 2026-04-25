/**
 * Solucionador del Método Simplex Dual con seguimiento completo del tableau.
 * 
 * El Simplex Dual parte de una base DUAL FACTIBLE (todos los costos reducidos ≥ 0)
 * pero PRIMAL INFACTIBLE (algunos RHS < 0). Itera pivoteando para restaurar
 * factibilidad primal manteniendo factibilidad dual.
 *
 * Reglas de pivoteo:
 *  - Fila pivote: fila con el RHS más negativo (variable que sale).
 *  - Columna pivote: entre los a_{ij} < 0 de la fila pivote, la que minimiza |z_j / a_{ij}| (entra).
 *
 * Configuración del tableau:
 *  - Restricciones <=  → se agrega slack directamente.
 *  - Restricciones >=  → se multiplica por -1 (queda <=) y se agrega slack → RHS negativo.
 *  - Restricciones =   → no soportadas (lanzar error al llamador).
 *
 * objetivo: { type: "max"|"min", coefficients: number[] }
 * restricciones: { coefficients: number[], sign: "<="|">=", rhs: number }[]
 * decisionVarNames: string[] opcional
 */

/**
 * Copia profunda de un arreglo 2D.
 */
function copyTableau(t) {
  return t.map((row) => [...row]);
}

/**
 * Realiza la operación de pivoteo (eliminación gaussiana) sobre el tableau en su lugar.
 */
function pivot(tableau, pivotRow, pivotCol) {
  const numCols = tableau[0].length;
  const pivotElem = tableau[pivotRow][pivotCol];

  for (let j = 0; j < numCols; j++) {
    tableau[pivotRow][j] /= pivotElem;
  }

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
 * Construye el tableau inicial para el Simplex Dual.
 * Solo usa variables de holgura (no artificiales).
 */
export function buildDualTableau(objective, constraints, decisionVarNames) {
  const n = objective.coefficients.length;

  if (!decisionVarNames || decisionVarNames.length !== n) {
    decisionVarNames = Array.from({ length: n }, (_, i) => `x${i + 1}`);
  }

  const m = constraints.length;
  const numCols = n + m + 1;

  const varNames = [...decisionVarNames];
  for (let i = 0; i < m; i++) varNames.push(`s${i + 1}`);

  const tableau = [];
  const basicVars = [];

  constraints.forEach((c, i) => {
    const row = new Array(numCols).fill(0);
    // >= → multiplicar por -1 para convertir a <=
    const flip = c.sign === ">=" ? -1 : 1;
    c.coefficients.forEach((coef, j) => {
      row[j] = flip * coef;
    });
    row[n + i] = 1; // variable de holgura
    row[numCols - 1] = flip * c.rhs;
    basicVars.push(n + i);
    tableau.push(row);
  });

  // Fila Z
  const zRow = new Array(numCols).fill(0);
  const isMax = objective.type === "max";
  objective.coefficients.forEach((coef, j) => {
    // Maximización: negamos coeficientes (convenio: óptimo cuando todos ≥ 0).
    // Minimización: coeficientes positivos (si c_j ≥ 0, dual factible desde el inicio).
    zRow[j] = isMax ? -coef : coef;
  });
  tableau.push(zRow);

  return { tableau, basicVars, varNames, numDecision: n, slackCount: m, numCols };
}

/**
 * Encuentra la fila pivote del Simplex Dual:
 * la restricción con el RHS más negativo (variable básica más infactible).
 * Retorna -1 si todos los RHS ≥ 0 (solución primal factible).
 */
function findDualPivotRow(tableau) {
  const numRows = tableau.length - 1;
  let minRHS = -1e-9;
  let row = -1;
  for (let i = 0; i < numRows; i++) {
    const rhs = tableau[i][tableau[i].length - 1];
    if (rhs < minRHS) {
      minRHS = rhs;
      row = i;
    }
  }
  return row;
}

/**
 * Encuentra la columna pivote del Simplex Dual (prueba de razón dual):
 * entre los a_{pivotRow, j} < 0, elige el que minimiza |z_j / a_{pivotRow, j}|.
 * Retorna -1 si no hay elementos negativos (problema infactible).
 */
function findDualPivotCol(tableau, pivotRow) {
  const zRow = tableau[tableau.length - 1];
  const numCols = tableau[0].length;
  let minRatio = Infinity;
  let col = -1;
  for (let j = 0; j < numCols - 1; j++) {
    const a = tableau[pivotRow][j];
    if (a < -1e-10) {
      const ratio = Math.abs(zRow[j] / a);
      if (ratio < minRatio - 1e-10) {
        minRatio = ratio;
        col = j;
      }
    }
  }
  return col;
}

/**
 * Resuelve el problema usando el Método Simplex Dual.
 * Retorna el mismo formato que solveSimplex para compatibilidad con los componentes existentes.
 */
export function solveDualSimplex(objective, constraints, decisionVarNames) {
  if (constraints.length === 0) {
    return { status: "infeasible", iterations: [], optimalZ: null, variables: null };
  }

  // El Simplex Dual no soporta restricciones de igualdad directamente
  for (const c of constraints) {
    if (c.sign === "=") {
      return {
        status: "invalid",
        message:
          "El Simplex Dual no soporta restricciones de igualdad (=). Usa solo <= y >=.",
        iterations: [],
        optimalZ: null,
        variables: null,
      };
    }
  }

  const built = buildDualTableau(objective, constraints, decisionVarNames);
  let { tableau, basicVars, varNames, numDecision, slackCount, numCols } = built;

  const isMax = objective.type === "max";

  // Verificar factibilidad dual: todos los coeficientes en la fila Z deben ser ≥ 0
  const zRow = tableau[tableau.length - 1];
  for (let j = 0; j < numCols - 1; j++) {
    if (zRow[j] < -1e-9) {
      return {
        status: "not-dual-feasible",
        message:
          "El problema no es dual factible en la base inicial. " +
          "Para minimización, asegúrate de que todos los coeficientes de la función objetivo sean ≥ 0. " +
          "Para maximización, todos deben ser ≤ 0.",
        iterations: [],
        optimalZ: null,
        variables: null,
        varNames,
        numDecision,
        slackCount,
        surplusCount: 0,
        artificialCount: 0,
      };
    }
  }

  const iterations = [];

  iterations.push({
    tableau: copyTableau(tableau),
    basicVars: [...basicVars],
    pivotRow: null,
    pivotCol: null,
    zValue: isMax
      ? tableau[tableau.length - 1][numCols - 1]
      : -tableau[tableau.length - 1][numCols - 1],
    operation: "Tableau Inicial — Simplex Dual",
  });

  const MAX_ITER = 100;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const pivotRow = findDualPivotRow(tableau);
    if (pivotRow === -1) break; // todos los RHS ≥ 0 → óptimo

    const pivotCol = findDualPivotCol(tableau, pivotRow);
    if (pivotCol === -1) {
      return {
        status: "infeasible",
        iterations,
        optimalZ: null,
        variables: null,
        varNames,
        numDecision,
        slackCount,
        surplusCount: 0,
        artificialCount: 0,
      };
    }

    const enteringVar = varNames[pivotCol];
    const leavingVar = varNames[basicVars[pivotRow]];

    pivot(tableau, pivotRow, pivotCol);
    basicVars[pivotRow] = pivotCol;

    iterations.push({
      tableau: copyTableau(tableau),
      basicVars: [...basicVars],
      pivotRow,
      pivotCol,
      zValue: isMax
        ? tableau[tableau.length - 1][numCols - 1]
        : -tableau[tableau.length - 1][numCols - 1],
      operation: `Entra: ${enteringVar} · Sale: ${leavingVar}`,
    });
  }

  const rawZ = tableau[tableau.length - 1][numCols - 1];
  const optimalZ = isMax ? rawZ : -rawZ;

  const variables = {};
  varNames.forEach((name) => {
    variables[name] = 0;
  });
  const numRows = tableau.length - 1;
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
    surplusCount: 0,
    artificialCount: 0,
  };
}
