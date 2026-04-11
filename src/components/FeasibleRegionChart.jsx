import { useMemo, useRef, useState, useEffect } from "react";
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

const MARGIN = { top: 24, right: 48, bottom: 36, left: 48 };

/**
 * Pure SVG chart — no Recharts dependency.
 * Renders a 4-quadrant coordinate system with constraint lines,
 * feasible region, vertices, and the optimal Z isoline.
 */
export default function FeasibleRegionChart({
  constraints,
  vertices,
  optimalVertex,
  objective,
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 480 });

  // Track container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { xMin, xMax, yMin, yMax } = useMemo(
    () => computeAxisRange(vertices, 3),
    [vertices]
  );

  // Plot area in pixels
  const plotW = size.width - MARGIN.left - MARGIN.right;
  const plotH = size.height - MARGIN.top - MARGIN.bottom;

  // Data → pixel transforms
  const sx = (x) => ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y) => plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Axis ticks
  const xTicks = useMemo(() => buildTicks(xMin, xMax, 10), [xMin, xMax]);
  const yTicks = useMemo(() => buildTicks(yMin, yMax, 8), [yMin, yMax]);

  const constraintLines = useMemo(
    () =>
      constraints.map((c, i) => ({
        key: `r${i}`,
        color: CONSTRAINT_COLORS[i % CONSTRAINT_COLORS.length],
        label: `R${i + 1}: ${c.cx}x + ${c.cy}y ${c.sign} ${c.rhs}`,
        points: getConstraintLinePoints(c, xMin, xMax, yMin, yMax),
        dashed: i % 2 === 1,
      })),
    [constraints, xMin, xMax, yMin, yMax]
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

  const sortedVertices = useMemo(
    () => sortVerticesConvex(vertices),
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

      <div ref={containerRef} style={{ width: "100%", height: 480 }}>
        <svg
          width={size.width}
          height={size.height}
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <clipPath id="plot-clip">
              <rect x={0} y={0} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {/* Translate everything by margin */}
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* Grid lines */}
            {xTicks.map((t) => (
              <line
                key={`gx${t}`}
                x1={sx(t)} y1={0}
                x2={sx(t)} y2={plotH}
                stroke="var(--border)"
                strokeWidth={1}
                opacity={0.7}
              />
            ))}
            {yTicks.map((t) => (
              <line
                key={`gy${t}`}
                x1={0} y1={sy(t)}
                x2={plotW} y2={sy(t)}
                stroke="var(--border)"
                strokeWidth={1}
                opacity={0.7}
              />
            ))}

            {/* Feasible region polygon (clipped) */}
            {sortedVertices.length >= 3 && (
              <polygon
                clipPath="url(#plot-clip)"
                points={sortedVertices.map((v) => `${sx(v.x)},${sy(v.y)}`).join(" ")}
                fill="#4f8ef7"
                fillOpacity={0.15}
                stroke="#4f8ef7"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            )}

            {/* Constraint lines (clipped) */}
            <g clipPath="url(#plot-clip)">
              {constraintLines.map((cl) =>
                cl.points.length === 2 ? (
                  <line
                    key={cl.key}
                    x1={sx(cl.points[0].x)}
                    y1={sy(cl.points[0].y)}
                    x2={sx(cl.points[1].x)}
                    y2={sy(cl.points[1].y)}
                    stroke={cl.color}
                    strokeWidth={2}
                    strokeDasharray={cl.dashed ? "6 3" : undefined}
                  />
                ) : null
              )}

              {/* Z isoline */}
              {zLine && zLine.length === 2 && (
                <line
                  x1={sx(zLine[0].x)}
                  y1={sy(zLine[0].y)}
                  x2={sx(zLine[1].x)}
                  y2={sy(zLine[1].y)}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                />
              )}
            </g>

            {/* Axes (on top of grid, behind labels) */}
            {/* X axis */}
            <line
              x1={0} y1={sy(0)}
              x2={plotW} y2={sy(0)}
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
            />
            {/* Y axis */}
            <line
              x1={sx(0)} y1={0}
              x2={sx(0)} y2={plotH}
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
            />

            {/* X tick marks and labels */}
            {xTicks.map((t) => (
              <g key={`xtick${t}`}>
                <line
                  x1={sx(t)} y1={sy(0) - 4}
                  x2={sx(t)} y2={sy(0) + 4}
                  stroke="var(--text-secondary)"
                  strokeWidth={1}
                />
                <text
                  x={sx(t)}
                  y={sy(0) + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--text-muted)"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* Y tick marks and labels */}
            {yTicks.map((t) => (
              <g key={`ytick${t}`}>
                <line
                  x1={sx(0) - 4} y1={sy(t)}
                  x2={sx(0) + 4} y2={sy(t)}
                  stroke="var(--text-secondary)"
                  strokeWidth={1}
                />
                {t !== 0 && (
                  <text
                    x={sx(0) - 8}
                    y={sy(t) + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--text-muted)"
                  >
                    {t}
                  </text>
                )}
              </g>
            ))}

            {/* Axis labels */}
            <text
              x={plotW - 4}
              y={sy(0) - 8}
              fontSize={12}
              fontWeight="bold"
              fill="var(--text-secondary)"
              textAnchor="end"
            >
              x
            </text>
            <text
              x={sx(0) + 6}
              y={10}
              fontSize={12}
              fontWeight="bold"
              fill="var(--text-secondary)"
            >
              y
            </text>

            {/* Vertex dots and coordinate labels */}
            {vertices.map((v, i) => {
              const isOptimal =
                optimalVertex &&
                Math.abs(v.x - optimalVertex.x) < 1e-5 &&
                Math.abs(v.y - optimalVertex.y) < 1e-5;
              return (
                <g key={i}>
                  <circle
                    cx={sx(v.x)}
                    cy={sy(v.y)}
                    r={isOptimal ? 7 : 4}
                    fill={isOptimal ? "#f59e0b" : "#64748b"}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={sx(v.x) + 10}
                    y={sy(v.y) + 4}
                    fontSize={10}
                    fill={isOptimal ? "#f59e0b" : "#94a3b8"}
                    fontWeight={isOptimal ? "700" : "400"}
                    style={{ userSelect: "none" }}
                  >
                    ({v.x.toFixed(2)}, {v.y.toFixed(2)})
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {constraintLines.map((cl, i) => (
          <div key={i} className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ background: cl.color }}
            />
            <span className={styles.legendLabel}>{cl.label}</span>
          </div>
        ))}
        {zLine && (
          <div className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ background: "#f59e0b" }}
            />
            <span className={styles.legendLabel}>
              z = {zOptimalLabel} (óptimo)
            </span>
          </div>
        )}
        <div className={styles.legendItem}>
          <span
            className={styles.legendFill}
            style={{
              background: "#4f8ef733",
              border: "1px dashed #4f8ef7",
            }}
          />
          <span className={styles.legendLabel}>Región factible</span>
        </div>
      </div>
    </div>
  );
}

/** Generate ~n round tick values between min and max */
function buildTicks(min, max, targetCount) {
  const range = max - min;
  const rawStep = range / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10];
  let step = magnitude;
  for (const c of candidates) {
    const s = c * magnitude;
    if (range / s <= targetCount * 1.5) {
      step = s;
      break;
    }
  }
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let t = start; t <= max + 1e-10; t += step) {
    ticks.push(Math.round(t * 1e9) / 1e9); // fix floating point
  }
  return ticks;
}
