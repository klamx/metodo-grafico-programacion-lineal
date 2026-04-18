/**
 * Solucionador del Método Simplex con seguimiento completo del tableau.
 * Maneja maximización y minimización (convierte min → max internamente).
 * Soporta restricciones <= (agrega holgura), >= (resta exceso + agrega artificial), = (agrega artificial).
 * Usa el método de la Gran M para variables artificiales.
 *
 * objetivo: { type: "max"|"min", coefficients: number[] }
 * restricciones: { coefficients: number[], sign: "<="|">="|"=", rhs: number }[]
 * decisionVarNames: string[] (ej. ["x1","x2","x3"]) — opcional, por defecto x1..xn
 */

const BIG_M = 1e6;

/**
 * Construye el tableau inicial del simplex.
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
    // Negamos los coeficientes para maximización: el óptimo se alcanza cuando no haya negativos en la fila Z
    zRow[j] = isMax ? -coef : coef;
  });

  // Penalización Gran M para variables artificiales
  const artificialStart = numDecision + slackCount + surplusCount;
  for (let i = artificialStart; i < totalVars; i++) {
    zRow[i] = BIG_M;
  }
  tableau.push(zRow);

  // Eliminar artificiales de la fila Z: hacer cero los coeficientes de las variables básicas artificiales
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
 * Busca la columna pivote: el coeficiente más negativo en la fila Z.
 * Retorna el índice o -1 si ya se alcanzó el óptimo.
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
 * Busca la fila pivote: prueba de razón mínima.
 * Retorna el índice o -1 si el problema es no acotado.
 */
function findPivotRow(tableau, pivotCol) {
  const numRows = tableau.length - 1; // excluye la fila Z
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
 * Realiza la operación de pivoteo. Modifica el tableau en su lugar (eliminación gaussiana).
 */
function pivot(tableau, pivotRow, pivotCol) {
  const numCols = tableau[0].length;
  const pivotElem = tableau[pivotRow][pivotCol];

  // Normalizar la fila pivote para que el elemento pivote quede en 1
  for (let j = 0; j < numCols; j++) {
    tableau[pivotRow][j] /= pivotElem;
  }

  // Eliminar la columna pivote en todas las demás filas (poner en 0)
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
 * Copia profunda de un arreglo 2D.
 */
function copyTableau(t) {
  return t.map((row) => [...row]);
}

/**
 * Resuelve el problema de programación lineal usando el Método Simplex.
 * Retorna { iterations, status, optimalZ, variables }
 * objetivo: { type, coefficients }
 * restricciones: [{ coefficients, sign, rhs }]
 * decisionVarNames: string[] opcional
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

  // Guardar snapshot del tableau inicial
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
    if (pivotCol === -1) break; // se alcanzó el óptimo

    const pivotRow = findPivotRow(tableau, pivotCol);
    if (pivotRow === -1) {
      return { status: "unbounded", iterations, optimalZ: null, variables: null };
    }

    // Registrar qué variable entra y cuál sale antes de pivotar
    const enteringVar = varNames[pivotCol];
    const leavingVar = varNames[basicVars[pivotRow]];

    pivot(tableau, pivotRow, pivotCol);
    basicVars[pivotRow] = pivotCol;

    // Guardar snapshot después del pivote
    iterations.push({
      tableau: copyTableau(tableau),
      basicVars: [...basicVars],
      pivotRow,
      pivotCol,
      zValue: isMax ? tableau[tableau.length - 1][numCols - 1] : -tableau[tableau.length - 1][numCols - 1],
      operation: `Entra: ${enteringVar} · Sale: ${leavingVar}`,
    });
  }

  // Verificar factibilidad: si alguna artificial sigue en la base con valor > epsilon, no hay solución
  const numRows = tableau.length - 1;
  for (let i = 0; i < numRows; i++) {
    if (basicVars[i] >= artificialStart) {
      const val = tableau[i][numCols - 1];
      if (Math.abs(val) > 1e-6) {
        return { status: "infeasible", iterations, optimalZ: null, variables: null };
      }
    }
  }

  // Extraer la solución.
  // Z[RHS] acumula el valor real del objetivo tras los pivotes.
  // Para max: la fila Z se inicializó con -coef, por lo que Z[RHS] = +valor_objetivo.
  // Para min: se usó +coef (objetivo negado), por lo que Z[RHS] = -valor_objetivo → se niega al final.
  const rawZ = tableau[tableau.length - 1][numCols - 1];
  const optimalZ = isMax ? rawZ : -rawZ;

  // Las variables no básicas valen 0; las básicas toman el valor del RHS de su fila
  const variables = {};
  varNames.forEach((name) => {
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
