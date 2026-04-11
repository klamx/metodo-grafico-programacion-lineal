import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Scatter,
  ResponsiveContainer,
  Customized,
} from "recharts";
import {
  computeAxisRange,
  getConstraintLinePoints,
  sortVerticesConvex,
} from "../utils/linearProgramming";
import styles from "./FeasibleRegionChart.module.css";

const CONSTRAINT_COLORS = [
  "#4f8ef7",
  "#f7914f",
  "#4fcf7a",
  "#f74f9e",
  "#a04ff7",
  "#f7cf4f",
  "#4ff7f0",
];

/**
 * Custom SVG layer that draws the shaded feasible region polygon.
 * Uses recharts' internal scale functions passed via the Customized component.
 */
function FeasiblePolygon({ xAxisMap, yAxisMap, vertices }) {
  if (!vertices || vertices.length < 3) return null;

  const xScale = Object.values(xAxisMap)[0];
  const yScale = Object.values(yAxisMap)[0];
  if (!xScale || !yScale) return null;

  const points = vertices
    .map((v) => `${xScale(v.x)},${yScale(v.y)}`)
    .join(" ");

  return (
    <polygon
      points={points}
      fill="#4f8ef7"
      fillOpacity={0.12}
      stroke="#4f8ef7"
      strokeWidth={1}
      strokeDasharray="4 2"
    />
  );
}

/**
 * Custom dot renderer for scatter plot vertices.
 */
function VertexDot({ cx, cy, payload, optimalVertex }) {
  if (cx == null || cy == null) return null;

  const isOptimal =
    optimalVertex &&
    Math.abs(payload.x - optimalVertex.x) < 1e-5 &&
    Math.abs(payload.y - optimalVertex.y) < 1e-5;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={isOptimal ? 8 : 5}
        fill={isOptimal ? "#f59e0b" : "#64748b"}
        stroke="#fff"
        strokeWidth={2}
      />
      <text
        x={cx + 11}
        y={cy + 4}
        fontSize={10}
        fill={isOptimal ? "#f59e0b" : "#94a3b8"}
        fontWeight={isOptimal ? "700" : "400"}
      >
        ({payload.x.toFixed(2)}, {payload.y.toFixed(2)})
      </text>
    </g>
  );
}

export default function FeasibleRegionChart({
  constraints,
  vertices,
  optimalVertex,
  objective,
}) {
  const { xMin, xMax, yMin, yMax } = useMemo(
    () => computeAxisRange(vertices, 3),
    [vertices]
  );

  const constraintLines = useMemo(
    () =>
      constraints.map((c, i) => ({
        color: CONSTRAINT_COLORS[i % CONSTRAINT_COLORS.length],
        label: `R${i + 1}: ${c.cx}x + ${c.cy}y ${c.sign} ${c.rhs}`,
        points: getConstraintLinePoints(c, xMin, xMax, yMin, yMax),
      })),
    [constraints, xMin, xMax, yMin, yMax]
  );

  const sortedVertices = useMemo(
    () => sortVerticesConvex(vertices),
    [vertices]
  );

  const zLine = useMemo(() => {
    if (!optimalVertex || !objective) return null;
    const { cx: ocx, cy: ocy } = objective;
    const zVal = ocx * optimalVertex.x + ocy * optimalVertex.y;
    if (Math.abs(ocy) > 1e-10) {
      return [
        { x: xMin, y: (zVal - ocx * xMin) / ocy },
        { x: xMax, y: (zVal - ocx * xMax) / ocy },
      ];
    }
    if (Math.abs(ocx) > 1e-10) {
      return [
        { x: zVal / ocx, y: yMin },
        { x: zVal / ocx, y: yMax },
      ];
    }
    return null;
  }, [optimalVertex, objective, xMin, xMax, yMin, yMax]);

  const vertexScatterData = useMemo(
    () => vertices.map((v) => ({ x: v.x, y: v.y })),
    [vertices]
  );

  const zOptimalLabel = optimalVertex
    ? (objective.cx * optimalVertex.x + objective.cy * optimalVertex.y).toFixed(2)
    : "";

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.chartTitle}>
        {objective.type === "max" ? "Maximizar" : "Minimizar"} Z ={" "}
        {objective.cx}x + {objective.cy}y
      </h3>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart margin={{ top: 20, right: 40, bottom: 20, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.6}
          />
          <XAxis
            type="number"
            dataKey="x"
            domain={[xMin, xMax]}
            tickCount={Math.min(Math.round(xMax - xMin) + 1, 20)}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            label={{
              value: "x",
              position: "insideRight",
              offset: -5,
              fontSize: 12,
              fill: "var(--text-secondary)",
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[yMin, yMax]}
            tickCount={Math.min(Math.round(yMax - yMin) + 1, 20)}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            label={{
              value: "y",
              angle: -90,
              position: "insideTop",
              offset: 10,
              fontSize: 12,
              fill: "var(--text-secondary)",
            }}
          />

          <ReferenceLine x={0} stroke="var(--text-secondary)" strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="var(--text-secondary)" strokeWidth={1.5} />

          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? value.toFixed(4) : value
            }
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "0.82rem",
            }}
          />

          {/* Feasible region shading via custom SVG */}
          <Customized
            component={(props) => (
              <FeasiblePolygon {...props} vertices={sortedVertices} />
            )}
          />

          {/* Constraint boundary lines */}
          {constraintLines.map((cl, i) =>
            cl.points.length === 2 ? (
              <Line
                key={`c-${i}`}
                data={cl.points}
                dataKey="y"
                dot={false}
                activeDot={false}
                stroke={cl.color}
                strokeWidth={2}
                strokeDasharray={i % 2 === 1 ? "6 3" : "0"}
                name={cl.label}
                legendType="plainline"
              />
            ) : null
          )}

          {/* Optimal Z isoline */}
          {zLine && (
            <Line
              data={zLine}
              dataKey="y"
              dot={false}
              activeDot={false}
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              name={`z = ${zOptimalLabel}`}
              legendType="plainline"
            />
          )}

          {/* Vertices as scatter dots */}
          <Scatter
            data={vertexScatterData}
            name="Vértices"
            shape={(props) => (
              <VertexDot {...props} optimalVertex={optimalVertex} />
            )}
            legendType="circle"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Manual legend */}
      <div className={styles.legend}>
        {constraintLines.map((cl, i) => (
          <div key={i} className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{
                background: cl.color,
                opacity: i % 2 === 1 ? 0.7 : 1,
              }}
            />
            <span className={styles.legendLabel}>{cl.label}</span>
          </div>
        ))}
        {zLine && (
          <div className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: "#f59e0b" }} />
            <span className={styles.legendLabel}>z = {zOptimalLabel} (óptimo)</span>
          </div>
        )}
        <div className={styles.legendItem}>
          <span
            className={styles.legendFill}
            style={{ background: "#4f8ef733", border: "1px dashed #4f8ef7" }}
          />
          <span className={styles.legendLabel}>Región factible</span>
        </div>
      </div>
    </div>
  );
}
