# Cómo funciona el Método Simplex — explicación para niños de 5 años 🧒

---

## ¿Qué problema queremos resolver?

Imagina que tienes galletas y chocolates. Por cada galleta ganas **3 monedas** y por cada chocolate ganas **2 monedas**. Pero no puedes hacer infinitas galletas ni chocolates: el horno tiene límites.

El problema es: **¿cuántas galletas y chocolates hago para ganar el mayor dinero posible sin romper las reglas del horno?**

Eso es exactamente lo que resuelve el Método Simplex.

---

## Paso 1 — Leer lo que escribiste (`simplexParser.js`)

### `parseLinearExpr(expr)`

Toma un texto como `"3x1 + 2x2"` y lo convierte en un mapa de números:
```
{ x1: 3, x2: 2 }
```
Usa una **expresión regular** que busca patrones del tipo `número×variable`. Si no hay número antes de la variable, asume que es `1`. Si hay un `-`, asume `-1`.

### `parseObjective(str)`

Lee la línea de la función objetivo. Por ejemplo:
```
"max z = 3x1 + 2x2"
```
- Detecta si es `max` o `min` mirando la primera palabra.
- Elimina la etiqueta `z =` (que es solo decorativa).
- Llama a `parseLinearExpr` para extraer los coeficientes.
- Devuelve `{ type: "max", varTerms: { x1: 3, x2: 2 } }`.

### `parseConstraintLine(str)`

Lee una restricción como `"x1 + x2 <= 4"`:
- Busca el operador (`<=`, `>=`, `=`) y parte el texto en dos.
- La parte izquierda se parsea con `parseLinearExpr`.
- La parte derecha es el número límite (RHS = *Right Hand Side*).
- Devuelve `{ varTerms: { x1: 1, x2: 1 }, sign: "<=", rhs: 4 }`.

### `parseProblem(objectiveText, constraintsText)`

Orquesta todo:
1. Parsea la función objetivo.
2. Parsea cada línea de restricciones.
3. Reúne **todos** los nombres de variables que aparecieron (en objetivo y restricciones juntos).
4. Los ordena naturalmente: `x1 < x2 < x3 < ... < x10`.
5. Convierte todo a arrays de coeficientes ordenados, para que las funciones de álgebra puedan trabajar fácil.

---

## Paso 2 — Preparar la mesa de trabajo: el Tableau (`buildTableau`)

Imagina que el problema original es:

```
Maximizar:  Z = 3x1 + 2x2
Sujeto a:
  x1 + x2  <=  4
  3x1 + x2 <=  5
  x1 >= 0
  x2 >= 0
```

### ¿Qué es el tableau?

Es una **tabla de números** donde cada fila es una restricción y cada columna es una variable. Como una hoja de cálculo gigante.

### Variables de holgura (`s`) — las restricciones `<=`

`x1 + x2 <= 4` significa: "la suma no puede pasar de 4". Para convertirlo en igualdad, agregamos una variable de **holgura** `s1` que absorbe el espacio sobrante:

```
x1 + x2 + s1 = 4
```

Si `x1=1, x2=1`, entonces `s1=2` (sobran 2 unidades de capacidad). La holgura es el "espacio libre que queda".

### Variables de exceso (`e`) y artificiales (`a`) — las restricciones `>=`

`x1 >= 2` significa "al menos 2". La convertimos restando una variable de exceso `e1` y sumando una artificial `a1`:

```
x1 - e1 + a1 = 2
```

La variable artificial `a1` es un **truco matemático** — existe solo para arrancar el algoritmo. Se le pone un costo enorme (`BIG_M = 1,000,000`) para que el algoritmo la quiera sacar cuanto antes.

### La fila Z (función objetivo)

La última fila de la tabla representa la función objetivo. Se guarda con los coeficientes **negados** (si es maximización):

```
Z: -3·x1 + -2·x2 + 0·s1 + 0·s2 = 0
```

¿Por qué negados? Porque el algoritmo avanza poniendo en cero los coeficientes negativos. Cuando no queda ninguno negativo en esta fila, llegamos al óptimo.

### Eliminar artificiales de la fila Z

Si una variable artificial está en la **base inicial**, su columna tiene un 1 en su fila. Eso contaminaría la fila Z. Por eso se hace una operación de fila para poner ese coeficiente en 0 antes de empezar.

---

## Paso 3 — Buscar el mejor movimiento (`findPivotCol`)

El algoritmo pregunta: **"¿qué variable puede mejorar más el resultado?"**

Mira la fila Z y busca el **coeficiente más negativo**. Ese es el candidato a entrar a la base (la "columna pivote"). Si no hay negativos → ¡ya llegamos al óptimo!

---

## Paso 4 — Ver cuánto podemos movernos (`findPivotRow`)

Ahora sabe *qué* variable va a entrar. Necesita saber *cuánto* puede aumentar antes de romper una restricción.

Para cada fila de restricción, calcula:
```
ratio = RHS ÷ coeficiente_en_columna_pivote
```
Solo donde el coeficiente es positivo (si es negativo o cero, esa restricción no limita).

Elige la fila con el **ratio mínimo** — esa es la restricción más apretada. La variable de esa fila va a salir de la base.

Si no hay ningún ratio válido → el problema es **no acotado** (puedes ganar infinito, lo cual normalmente significa que el modelo está mal).

---

## Paso 5 — El pivote (`pivot`)

El pivote es el corazón del algoritmo. Es básicamente **álgebra de matrices**: eliminación gaussiana.

1. **Normalizar la fila pivote**: divide todos los números de esa fila por el elemento pivote, para que ese elemento quede en `1`.
2. **Eliminar en todas las demás filas**: para cada otra fila, resta un múltiplo de la fila pivote para poner un `0` en la columna pivote.

Resultado: la variable entrante ahora tiene un `1` en su fila y `0` en todas las demás → está "en la base".

---

## Paso 6 — Repetir hasta terminar (`solveSimplex`)

El algoritmo hace un bucle:

```
mientras haya coeficiente negativo en fila Z:
    1. findPivotCol → columna pivote
    2. findPivotRow → fila pivote
    3. pivot → actualizar tabla
    4. guardar snapshot de la tabla (para mostrar paso a paso)
```

Cada vuelta del bucle se llama **iteración**. En cada iteración entra una variable y sale otra.

Se guarda un **snapshot** de la tabla en cada iteración para mostrarlo en pantalla — eso es lo que ves en el "Tableau Paso a Paso".

### ¿Cuándo termina?

- **Óptimo**: no hay coeficientes negativos en la fila Z → `status: "optimal"`.
- **No acotado**: no hay fila pivote válida → `status: "unbounded"`.
- **Infactible**: al final alguna variable artificial sigue en la base con valor > 0 → `status: "infeasible"` (las restricciones son contradictorias).

---

## Paso 7 — Leer el resultado

Al terminar:

- **`optimalZ`**: el valor en la esquina inferior derecha de la tabla (fila Z, columna RHS).
  - Si es maximización: ese número *ya es* el valor óptimo (los coeficientes negativados se cancelan tras los pivotes).
  - Si es minimización: se negó el objetivo al inicio, así que al final se niega el resultado para recuperar el valor real.

- **Variables de decisión**: para cada variable en la base (`basicVars`), su valor es el número de la columna RHS en su fila. Las variables que no están en la base valen `0`.

---

## Resumen visual del flujo completo

```
Texto del usuario
        │
        ▼
  simplexParser.js
  ┌─────────────────────────────┐
  │ parseLinearExpr             │  "3x1 + 2x2"  →  {x1:3, x2:2}
  │ parseObjective              │  detecta max/min
  │ parseConstraintLine         │  detecta <=, >=, =
  │ parseProblem                │  reúne todo, ordena vars
  └─────────────────────────────┘
        │
        ▼ objective + constraints (arrays numéricos)
        │
  simplex.js
  ┌─────────────────────────────┐
  │ buildTableau                │  crea la tabla, agrega s, e, a
  │                             │  prepara fila Z negada
  │                             │  elimina artificiales de fila Z
  └─────────────────────────────┘
        │
        ▼ tableau inicial
        │
  ┌─────────────────────────────┐
  │ BUCLE (máx 50 iteraciones): │
  │   findPivotCol              │  columna más negativa en Z
  │   findPivotRow              │  ratio mínimo (restricción activa)
  │   pivot                     │  eliminación gaussiana
  │   guardar snapshot          │  para mostrar en pantalla
  └─────────────────────────────┘
        │
        ▼ resultado final
  { status, optimalZ, variables, iterations[] }
        │
        ▼
  SimplexSolution.jsx  →  muestra Z óptimo y valores de variables
  SimplexTableau.jsx   →  muestra cada iteración con tabla y pivotes
```

---

## Analogía final para el niño de 5 años 🧒

Imagina que estás en un laberinto de cuartos. Cada cuarto tiene un puntaje. Quieres llegar al cuarto con el puntaje más alto.

- Cada **iteración** es abrir una puerta y pasar a un cuarto mejor.
- El **pivote** es la llave que abre esa puerta.
- El algoritmo siempre elige la puerta que promete el mayor salto de puntaje.
- Cuando no hay ninguna puerta que mejore el puntaje → ¡ya estás en el mejor cuarto!

El Simplex garantiza que **siempre llega al mejor cuarto** (si existe) en un número finito de pasos. 🏆
