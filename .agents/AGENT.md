# Agent Rules — Programación Lineal

## Project
React + Vite app. Solves linear programming problems via graphical and simplex methods.

## Stack
- React 19, Vite, recharts
- CSS Modules (no CSS-in-JS, no Tailwind)
- react-router-dom for routing

## Structure
```
src/
  pages/          # One component per route/method
  components/     # Shared + method-specific UI components
  hooks/          # useLinearProgram, useSimplex
  utils/          # linearProgramming.js, simplex.js
```

## Style Rules
- Use CSS variables from index.css (--bg, --surface, --border, --accent, etc.)
- Cards: border-radius 12px, var(--surface) bg, var(--border) border
- Buttons: accent color, border-radius 10px, font-weight 700
- Optimal solution card: green gradient (#065f46 → #047857)
- Infeasible card: red gradient (#7f1d1d → #991b1b)
- All new components must match existing style language

## Caveman Mode
Always respond in caveman mode (full level). User prefers compressed communication.

## Git
- Feature branch: `metodo-simplex`
- Commit when user asks

## Methods
1. **Graphic** — solves 2-variable LP graphically (existing)
2. **Simplex** — tableau-based simplex with step-by-step tableau display (new)

## Simplex display (see image reference)
- Show tableau per iteration
- Highlight pivot row/col
- Show basic variables each iteration
- Show Z value per iteration
- Final: total iterations, optimal Z, status badge
