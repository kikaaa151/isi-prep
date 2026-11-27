**O čo ide:** doména bunky = **zoznam čísel, ktoré do nej ešte môžu ísť**. Metóda jednoducho vyskúša všetkých deväť čísel a nechá tie, ktoré neporušia pravidlá.

### Krok za krokom

1. `if self.grid[r][c] != 0:` – je bunka už vyplnená? Potom nie je čo vyberať → `return []` (prázdny zoznam).
2. `domain = []` – sem budeme zbierať povolené čísla.
3. `for v in range(1, 10):` – čísla 1 až 9. (`range(1, 10)` desiatku neobsahuje.)
4. `if self.is_valid(r, c, v):` – opýtame sa metódy `is_valid`, či číslo `v` do bunky smie (nie je v riadku, stĺpci ani štvorci).
5. `domain.append(v)` – ak smie, pridáme ho.
6. `return domain` – napríklad `[3, 4, 5]`.

### Ako si to zapamätať

- Doména = všetky `v` z 1..9, pre ktoré platí `is_valid(r, c, v)`.
- Prázdna doména pri **prázdnej** bunke znamená slepú uličku – do bunky sa nedá dať nič, treba sa vrátiť.
- Túto metódu používa backtracking (z čoho vyberať), MRV (ktorá bunka má najmenej možností) aj forward checking (ostala niekomu prázdna doména?).
