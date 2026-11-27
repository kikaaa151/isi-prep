**O čo ide:** vyrobíme tabuľku čísel (maticu) s 3 riadkami a 5 stĺpcami a pozrieme sa na jej tvar a súčty. Je to zahrievací kód – overuje, že NumPy funguje.

### Krok za krokom

1. `import numpy as np` – načíta knižnicu NumPy pod skratkou `np`. Túto skratku používa každý.
2. `np.arange(15)` – vyrobí čísla `0, 1, 2, …, 14` (15 čísel, pätnástka tam už **nie je**).
3. `.reshape(3, 5)` – tie isté čísla poukladá do 3 riadkov po 5. Počet musí sedieť: 3 × 5 = 15.
4. `a.shape` – tvar poľa, teda `(3, 5)` = (riadky, stĺpce). `a.size` – počet všetkých prvkov, teda `15`.
5. `a.sum()` – súčet všetkých čísel: `105`.
6. `a.sum(1)` – súčet **v každom riadku** → tri čísla `[10 35 60]`.
7. `a.sum(0)` – súčet **v každom stĺpci** → päť čísel `[15 18 21 24 27]`.

### Ako si to zapamätať

- Číslo v zátvorke `sum(...)` je os, ktorá **zmizne**: os `0` sú riadky, os `1` sú stĺpce.
- `sum(0)` → riadky sa „zlejú“ dokopy, ostane jedno číslo na stĺpec.
- `sum(1)` → stĺpce sa zlejú, ostane jedno číslo na riadok.
- Poradie kódu: vyrob pole → vypíš `shape` a `size` → vypíš pole → tri súčty.
