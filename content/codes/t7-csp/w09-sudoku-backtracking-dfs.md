**O čo ide:** backtracking = **skús, a keď to nevyjde, vráť sa**. Presne tak, ako Sudoku rieši človek s ceruzkou a gumou: vyberiem prázdnu bunku, napíšem do nej povolené číslo a pokračujem. Ak sa neskôr zaseknem, vygumujem a skúsim ďalšie číslo.

Funkcia volá **samu seba** (rekurzia): každé volanie vyrieši jednu bunku a zvyšok nechá na ďalšie volanie.

### Krok za krokom

1. **Výber bunky:**
    - ak je zapnuté `use_mrv` → `cell, domain = self.select_unassigned_mrv()` (bunka s najmenej možnosťami, aj s jej doménou),
    - inak → `cell = self.board.find_empty()` (prvá prázdna bunka zľava zhora).
2. `if cell is None: return True` – žiadna prázdna bunka neostala → **Sudoku je vyriešené**. Toto je koniec rekurzie.
3. `r, c = cell` – riadok a stĺpec vybranej bunky.
4. `domain = self.board.get_domain(r, c)` – čísla, ktoré do bunky smú ísť (ak ich už nedal MRV).
5. `if use_lcv: domain = self.sort_values_lcv(r, c, domain)` – voliteľne zoradí čísla podľa heuristiky LCV.
6. `for val in domain:` – skúšame povolené čísla jedno po druhom:
    - `self.board.grid[r][c] = val` – **zapíš** číslo,
    - `self.expanded += 1` – počítadlo pokusov (a `gui_callback` len prekreslí okno),
    - `if self._dfs(use_mrv, use_lcv): return True` – **zavolaj sa znova** na zvyšok dosky. Ak sa zvyšok podarilo doriešiť, hotovo – úspech posielame nahor,
    - `self.board.grid[r][c] = 0` – inak číslo **vygumuj** (toto je ten krok späť – backtrack) a cyklus skúsi ďalšie.
7. `return False` – žiadne číslo z domény nevyšlo. Chyba je niekde skôr → volajúci musí zmeniť svoje číslo.

### Ako si to zapamätať

Šesť krokov: **vyber bunku → žiadna? `True` → doména → pre každú hodnotu: zapíš, rekurzia, vygumuj → `False`**.

- Dva návraty: `return True` (niet prázdnej bunky) a `return False` (minuli sa hodnoty).
- Riadok `self.board.grid[r][c] = 0` je to najdôležitejšie – bez neho by na doske ostalo zlé číslo.
- Skúšajú sa len čísla z domény, teda také, ktoré práve neporušujú pravidlá. Hrubá sila by skúšala všetkých deväť.
