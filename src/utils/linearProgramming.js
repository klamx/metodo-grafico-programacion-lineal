/**
 * Evalúa una restricción: a*x + b*y <= c  |  >= c  |  = c
 * Devuelve true si el punto (x, y) satisface la restricción.
 */
export function satisfiesConstraint(constraint, x, y) {
  const { cx, cy, rhs, sign } = constraint;
  const lhs = cx * x + cy * y;
  if (sign === "<=") return lhs <= rhs + 1e-9;
  if (sign === ">=") return lhs >= rhs - 1e-9;
  if (sign === "=") return Math.abs(lhs - rhs) <= 1e-9;
  return false;
}

/**
 * Resuelve un sistema lineal 2x2:
 *   a1*x + b1*y = c1
 *   a2*x + b2*y = c2
 * Devuelve { x, y } o null si no hay solución única.
 */
export function solveLinearSystem(a1, b1, c1, a2, b2, c2) {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return { x, y };
}

/**
 * Convierte una restricción a la forma: a*x + b*y = c (su línea frontera).
 * También genera las intersecciones con los ejes para restricciones de borde.
 */
export function getConstraintLines(constraints) {
  return constraints.map((c) => ({
    a: c.cx,
    b: c.cy,
    c: c.rhs,
  }));
}

/**
 * Encuentra todos los vértices candidatos de la región factible intersectando
 * cada par de líneas frontera de las restricciones.
 * Filtra para conservar solo los puntos que satisfacen TODAS las restricciones.
 */
export function findFeasibleVertices(constraints) {
  const lines = getConstraintLines(constraints);
  const candidates = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const pt = solveLinearSystem(
        lines[i].a, lines[i].b, lines[i].c,
        lines[j].a, lines[j].b, lines[j].c
      );
      if (pt && isFinite(pt.x) && isFinite(pt.y)) {
        candidates.push(pt);
      }
    }
  }

  // Agregar el origen como candidato
  candidates.push({ x: 0, y: 0 });

  const vertices = candidates.filter((pt) =>
    constraints.every((c) => satisfiesConstraint(c, pt.x, pt.y))
  );

  // Eliminar duplicados redondeando a 6 decimales
  const seen = new Set();
  return vertices.filter((pt) => {
    const key = `${pt.x.toFixed(6)},${pt.y.toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Evalúa la función objetivo Z = cx*x + cy*y en un vértice dado.
 */
export function evaluateObjective(objective, x, y) {
  return objective.cx * x + objective.cy * y;
}

/**
 * Resuelve el programa lineal:
 *   - encuentra los vértices factibles
 *   - evalúa Z en cada uno
 *   - elige el óptimo (máx o mín)
 * Devuelve { vertices, optimalVertex, optimalZ, feasible }
 */
export function solveLinearProgram(objective, constraints) {
  if (constraints.length < 2) {
    return { vertices: [], optimalVertex: null, optimalZ: null, feasible: false };
  }

  const vertices = findFeasibleVertices(constraints);

  if (vertices.length === 0) {
    return { vertices: [], optimalVertex: null, optimalZ: null, feasible: false };
  }

  const evaluated = vertices.map((v) => ({
    ...v,
    z: evaluateObjective(objective, v.x, v.y),
  }));

  const optimal = evaluated.reduce((best, current) => {
    if (objective.type === "max") return current.z > best.z ? current : best;
    return current.z < best.z ? current : best;
  });

  return {
    vertices: evaluated,
    optimalVertex: optimal,
    optimalZ: optimal.z,
    feasible: true,
  };
}

/**
 * Calcula un rango de ejes adecuado para la gráfica que incluye todos los
 * vértices y muestra los 4 cuadrantes si es necesario.
 */
export function computeAxisRange(vertices, padding = 2) {
  if (vertices.length === 0) return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);

  const xMin = Math.min(...xs, 0) - padding;
  const xMax = Math.max(...xs, 0) + padding;
  const yMin = Math.min(...ys, 0) - padding;
  const yMax = Math.max(...ys, 0) + padding;

  return { xMin, xMax, yMin, yMax };
}

/**
 * Calcula dos puntos extremos de la línea frontera de una restricción
 * dentro del rango visible de los ejes.
 */
export function getConstraintLinePoints(constraint, xMin, xMax, yMin, yMax) {
  const { cx, cy, rhs } = constraint;
  const points = [];

  // Si cy != 0, calcular y a partir de x en xMin y xMax
  if (Math.abs(cy) > 1e-10) {
    const y1 = (rhs - cx * xMin) / cy;
    const y2 = (rhs - cx * xMax) / cy;
    points.push({ x: xMin, y: y1 });
    points.push({ x: xMax, y: y2 });
  } else if (Math.abs(cx) > 1e-10) {
    // Línea vertical x = rhs/cx
    const xVal = rhs / cx;
    points.push({ x: xVal, y: yMin });
    points.push({ x: xVal, y: yMax });
  }

  return points;
}

/**
 * Ordena los vértices en sentido antihorario (envolvente convexa) para
 * dibujar el polígono de la región factible.
 */
export function sortVerticesConvex(vertices) {
  if (vertices.length < 3) return vertices;

  const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
  const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;

  return [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });
}
