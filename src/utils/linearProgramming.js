/**
 * Evaluates a constraint: a*x + b*y <= c  |  >= c  |  = c
 * Returns true if point (x, y) satisfies the constraint.
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
 * Solves a 2x2 linear system:
 *   a1*x + b1*y = c1
 *   a2*x + b2*y = c2
 * Returns { x, y } or null if no unique solution.
 */
export function solveLinearSystem(a1, b1, c1, a2, b2, c2) {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return { x, y };
}

/**
 * Converts a constraint to the form: a*x + b*y = c (its boundary line).
 * Also generates two boundary-axis-intersection lines from bound constraints.
 */
export function getConstraintLines(constraints) {
  return constraints.map((c) => ({
    a: c.cx,
    b: c.cy,
    c: c.rhs,
  }));
}

/**
 * Finds all candidate corner points (vertices) of the feasible region by
 * intersecting every pair of constraint boundary lines (including axis bounds).
 * Filters to keep only points that satisfy ALL constraints.
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

  // Also add origin
  candidates.push({ x: 0, y: 0 });

  const vertices = candidates.filter((pt) =>
    constraints.every((c) => satisfiesConstraint(c, pt.x, pt.y))
  );

  // Deduplicate by rounding to 6 decimals
  const seen = new Set();
  return vertices.filter((pt) => {
    const key = `${pt.x.toFixed(6)},${pt.y.toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Evaluates the objective function Z = cx*x + cy*y at a given vertex.
 */
export function evaluateObjective(objective, x, y) {
  return objective.cx * x + objective.cy * y;
}

/**
 * Solves the linear program:
 *   - finds feasible vertices
 *   - evaluates Z at each
 *   - picks optimal (max or min)
 * Returns { vertices, optimalVertex, optimalZ, feasible }
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
 * Computes a nice axis range for the chart that accommodates all vertices
 * and shows the 4 quadrants if needed.
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
 * Samples points along a constraint line within the visible axis range.
 * Returns two endpoints that span the visible area.
 */
export function getConstraintLinePoints(constraint, xMin, xMax, yMin, yMax) {
  const { cx, cy, rhs } = constraint;
  const points = [];

  // If cy != 0, compute y from x at xMin and xMax
  if (Math.abs(cy) > 1e-10) {
    const y1 = (rhs - cx * xMin) / cy;
    const y2 = (rhs - cx * xMax) / cy;
    points.push({ x: xMin, y: y1 });
    points.push({ x: xMax, y: y2 });
  } else if (Math.abs(cx) > 1e-10) {
    // Vertical line x = rhs/cx
    const xVal = rhs / cx;
    points.push({ x: xVal, y: yMin });
    points.push({ x: xVal, y: yMax });
  }

  return points;
}

/**
 * Sorts vertices in convex hull order (counter-clockwise) for polygon rendering.
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
