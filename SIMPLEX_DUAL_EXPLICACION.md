# Cómo funciona el Método Simplex Dual — explicación paso a paso 🔄

---

## ¿En qué se diferencia del Simplex normal?

El Simplex estándar arranca desde un punto **primal factible** (todos los RHS ≥ 0) y mejora el valor del objetivo iteración a iteración.

El Simplex Dual hace **exactamente lo opuesto**: arranca desde una solución **dual factible** (la fila Z ya está "en óptimo") pero **primal infactible** (algunos RHS son negativos, es decir, hay restricciones violadas). Luego itera para *restaurar la factibilidad primal* sin perder la factibilidad dual.

| Propiedad | Simplex estándar | Simplex Dual |
|---|---|---|
| RHS inicial | ≥ 0 (primal factible) | puede ser < 0 (infactible) |
| Fila Z inicial | puede tener negativos | todos ≥ 0 (dual factible) |
| ¿Qué se busca? | reducir el valor negativo en fila Z | eliminar los RHS negativos |
| Variables artificiales | sí (Gran M o Fase I) | **no** — no se necesitan |

---

## ¿Cuándo usar el Simplex Dual?

El caso natural es la **minimización con restricciones `>=`**:

```
min z = 2x1 + 3x2
s.a.
  x1 + x2  >= 4
  x1 + 3x2 >= 6
  x1, x2   >= 0
```

Los coeficientes de la función objetivo son todos positivos (`2 ≥ 0`, `3 ≥ 0`), lo que garantiza **factibilidad dual de entrada**. Las restricciones `>=` se convierten multiplicando por `-1`, lo que produce RHS negativos → se arranca infactible y el algoritmo recupera la factibilidad.

---

## Paso 1 — Parseo del problema

El módulo `simplexParser.js` se usa igual que en el Simplex estándar:

- `parseObjective("min z = 2x1 + 3x2")` → `{ type: "min", varTerms: { x1:2, x2:3 } }`
- `parseConstraintLine("x1 + x2 >= 4")` → `{ varTerms: { x1:1, x2:1 }, sign: ">=", rhs: 4 }`

---

## Paso 2 — Construir el tableau dual (`buildDualTableau`)

### Conversión de restricciones `>=`

Una restricción `>=` se **multiplica por `-1`** para convertirla en `<=`, y luego se agrega una variable de holgura normal:

```
Original:      x1 + x2 >= 4
Multiplicar:  -x1 - x2 <= -4
Con holgura:  -x1 - x2 + s1 = -4
```

Resultado: el RHS queda **negativo** (`-4`). Eso indica que la restricción está *violada* en la base inicial — la variable `s1` vale `-4`, lo que no tiene sentido físicamente. Eso es lo que el algoritmo va a corregir.

### Restricción `<=`

Se agrega holgura normal, RHS permanece positivo:

```
x1 + x2 <= 6  →  x1 + x2 + s2 = 6
```

### No hay variables artificiales

Esa es la gran ventaja del Simplex Dual: **no se necesita la Gran M ni la Fase I**. La holgura negativa reemplaza a las artificiales como punto de partida.

### La fila Z

Para **minimización**, los coeficientes van con su signo original positivo (sin negar):

```
min z = 2x1 + 3x2  →  fila Z: [ 2, 3, 0, 0 | 0 ]
```

Todos los coeficientes son ≥ 0 → **factibilidad dual satisfecha desde el inicio**.

Para **maximización**, se negarían igual que en el Simplex estándar.

### Tableau inicial del ejemplo

```
         x1    x2    s1    s2  | RHS
s1  [ -1   -1    1    0  | -4 ]   ← RHS negativo (restricción violada)
s2  [ -1   -3    0    1  | -6 ]   ← RHS negativo (restricción violada)
 Z  [  2    3    0    0  |  0 ]   ← todos ≥ 0: dual factible ✓
```

---

## Paso 3 — Elegir la fila pivote (`findDualPivotRow`)

La pregunta es: **¿qué restricción está más violada?**

Se busca la fila con el **RHS más negativo** (el menor de todos los negativos):

```
s1 → RHS = -4
s2 → RHS = -6  ← más negativo → FILA PIVOTE
```

La variable `s2` sale de la base.

---

## Paso 4 — Elegir la columna pivote (`findDualPivotCol`)

Este es el criterio que mantiene la factibilidad dual durante la iteración.

Solo se miran los coeficientes **negativos** de la fila pivote (si hubiera positivos o cero, esas columnas se ignoran):

```
Fila s2: [ -1, -3, 0, 1 | -6 ]
           ↑    ↑
        neg. neg.   → candidatos: x1 y x2
```

Para cada candidato se calcula la razón:

$$\text{razón}_j = \left| \frac{z_j}{a_{ij}} \right|$$

donde `z_j` es el coeficiente en la fila Z y `a_ij` es el coeficiente en la fila pivote.

```
x1:  |2 / -1| = 2.00
x2:  |3 / -3| = 1.00  ← mínimo → COLUMNA PIVOTE
```

La columna con la **razón mínima** es la elegida. Esto garantiza que los coeficientes de la fila Z no se vuelvan negativos tras el pivoteo.

Si **ningún coeficiente de la fila pivote fuera negativo**, el problema sería **infactible** (no hay solución).

---

## Paso 5 — El pivote

Idéntico al Simplex estándar — eliminación gaussiana:

1. Normalizar la fila pivote dividiendo por el elemento pivote.
2. Eliminar en todas las demás filas (incluyendo la fila Z) para poner un `0` en la columna pivote.

```
Elemento pivote: a[fila s2][col x2] = -3

Fila s2 ÷ -3:  [ 1/3,  1,  0, -1/3 | 2 ]

Actualizar s1:  s1 - (-1) × fila s2 →  [ -2/3, 0, 1, -1/3 | -2 ]
Actualizar Z :  Z  - (3)  × fila s2 →  [  1,   0, 0,   1   |  6 ]  (no negativo ✓)
```

### Tableau tras la 1ª iteración

```
         x1     x2    s1     s2  | RHS
s1  [ -2/3    0     1   -1/3 | -2 ]   ← aún negativo
x2  [  1/3    1     0   -1/3 |  2 ]   ← x2 entró a la base
 Z  [  1      0     0    1   |  6 ]   ← todos ≥ 0 ✓
```

---

## Paso 6 — Repetir hasta que todos los RHS sean ≥ 0

La única fila aún infactible es `s1` con RHS = `-2`.

Nueva fila pivote: `s1` (el único RHS negativo).

Candidatos negativos en esa fila: `x1` (coeficiente `-2/3`).

```
x1:  |1 / (-2/3)| = 1.5  ← único candidato → COLUMNA PIVOTE
```

Tras este pivote:

```
         x1    x2    s1      s2  | RHS
x1  [  1    0  -3/2   1/2 |  3 ]
x2  [  0    1   1/2  -1/2 |  1 ]
 Z  [  0    0   3/2   1/2 |  3 ]   ← todos ≥ 0, RHS > 0 → ÓPTIMO
```

---

## Paso 7 — Leer el resultado

Cuando **todos los RHS son ≥ 0** (factibilidad primal restaurada) y **todos los coeficientes en la fila Z son ≥ 0** (factibilidad dual mantenida), se llegó al óptimo.

- **`optimalZ`** = valor en la esquina inferior derecha de la fila Z.
  - Para minimización: se negó al construir, así que se niega de vuelta al leer.
  - Para maximización: se lee directo.
- **Variables básicas**: el valor de cada variable está en la columna RHS de su fila.
- **Variables no básicas**: valen `0`.

En el ejemplo:
```
x1 = 3
x2 = 1
z  = 3   (mínimo)
```

---

## Cuándo falla el Simplex Dual

### 1. No es dual factible al inicio

Si algún coeficiente de la fila Z es negativo al construir el tableau, el método no aplica directamente. El código retorna `status: "not-dual-feasible"` con un mensaje explicativo.

Eso suele pasar en maximización con coeficientes grandes o en minimización con coeficientes negativos. En esos casos conviene usar el Simplex estándar con la Gran M.

### 2. Problema infactible

Durante la iteración, si la fila pivote elegida tiene **todos sus coeficientes ≥ 0** (ninguno negativo), no se puede elegir columna pivote. Significa que el sistema de restricciones es **incompatible** — no existe ningún punto que satisfaga todas las restricciones simultáneamente.

### 3. Restricciones de igualdad (`=`)

El Simplex Dual implementado aquí no soporta `=` directamente. Se necesita un tratamiento especial (como subdividir en `<=` y `>=`). El código valida esto y retorna `status: "invalid"`.

---

## Resumen visual del flujo completo

```
Texto del usuario
        │
        ▼
  simplexParser.js (igual que Simplex estándar)
        │
        ▼ objective + constraints (arrays numéricos)
        │
  dualSimplex.js
  ┌──────────────────────────────────────────┐
  │ buildDualTableau                         │
  │   >= × (-1) → <=, slack, RHS negativo   │
  │   fila Z con coef. sin negar (min)       │
  │   SIN variables artificiales             │
  └──────────────────────────────────────────┘
        │
        ▼ verificar factibilidad dual (fila Z ≥ 0)
        │
  bucle de iteraciones:
  ┌──────────────────────────────────────────┐
  │ findDualPivotRow → RHS más negativo      │
  │   -1 si todos ≥ 0 → ÓPTIMO              │
  │ findDualPivotCol → min |z_j / a_ij|     │
  │   entre los a_ij < 0 de la fila pivote   │
  │   -1 si no hay → INFACTIBLE             │
  │ pivot → eliminación gaussiana            │
  │ guardar snapshot del tableau             │
  └──────────────────────────────────────────┘
        │
        ▼
  { status, optimalZ, variables, iterations }
        │
        ▼
  SimplexSolution + SimplexTableau
  (mismos componentes que el Simplex estándar)
```

---

## Diferencia clave entre las dos pruebas de razón

| Simplex estándar | Simplex Dual |
|---|---|
| Fila pivote: coef. más negativo en **fila Z** | Fila pivote: **RHS** más negativo |
| Columna pivote: razón mínima `RHS / a_ij` con `a_ij > 0` | Columna pivote: razón mínima `\|z_j / a_ij\|` con `a_ij < 0` |
| Mantiene factibilidad **primal** | Mantiene factibilidad **dual** |
| Mejora Z en cada paso | Restaura factibilidad primal en cada paso |
