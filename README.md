# 2D Computer Graphics Transformation Laboratory
Group 4 topic: design an object and apply translation, rotation, scaling, reflection, shearing and composite transformations.

## Run
Extract, open the folder in VS Code, open `index.html` with Live Server (or just double-click it). No backend or internet needed.

## How it works
- Every operation is a 3x3 homogeneous matrix built in `script.js` (`Tm`, `Rm`, `Sm`, `Hm`, `reflM`).
- Pivot / fixed-point operations use `T(p) · Op · T(-p)`.
- History is a list of matrices; the composite is `M = Mn x ... x M1` (M1 applied first).
- Animation interpolates the operation parameter from 0 to 1, then commits it to history.
- Tabs: History, Matrix Lab (step-by-step multiplication), Point Lab, Order Comparison, Coordinates, Formulas, Viva.
