**O čo ide:** heuristika je **rýchly odhad, ako ďaleko je stav od cieľa**. Nemusí byť presná, stačí, že rozumne napovie, ktorý stav vyzerá sľubnejšie. Greedy a A* podľa nej vyberajú, kam ísť. Tu sú dve heuristiky pre 8-puzzle.

Cieľ vyzerá takto: `1 2 3 / 4 5 6 / 7 8 0`.

### `count_misplaced_tiles` – koľko kociek nie je na mieste

1. `expected = list(range(1, self.size ** 2)) + [0]` – ako má vyzerať cieľ v jednom rade: `[1, 2, 3, 4, 5, 6, 7, 8, 0]`.
2. `flat = [num for row in self.board for num in row]` – aktuálna doska „vyrovnaná“ do jedného radu, riadok po riadku.
3. `sum(1 for i in range(len(flat)) if flat[i] != 0 and flat[i] != expected[i])` – prejdi pozície a pripočítaj 1 za každú kocku, ktorá je inde, než má byť. Podmienka `flat[i] != 0` znamená: **prázdne miesto nerátame**, nie je to kocka.

### `manhattan_distance` – ako ďaleko sú kocky od svojho miesta

1. Dva cykly cez riadky `r` a stĺpce `c` prejdú celú dosku.
2. `val = self.board[r][c]` – kocka na tomto políčku. `if val != 0:` – dieru opäť preskočíme.
3. Kam kocka patrí?
    - `goal_r = (val - 1) // self.size` – cieľový riadok (celočíselné delenie),
    - `goal_c = (val - 1) % self.size` – cieľový stĺpec (zvyšok po delení).
    - Príklad: kocka `6` na doske 3 × 3 → `(6 − 1) // 3 = 1`, `(6 − 1) % 3 = 2` → riadok 1, stĺpec 2. Sedí.
4. `distance += abs(goal_r - r) + abs(goal_c - c)` – o koľko riadkov a o koľko stĺpcov je kocka vedľa. To je „vzdialenosť po uliciach“ (Manhattan) – bez uhlopriečok.

### Príklad

Doska `8 1 3 / 4 0 2 / 7 6 5`: nesprávne umiestnených kociek je **5**, Manhattan vzdialenosť **10**, skutočne treba **14** ťahov.

### Ako si to zapamätať

- Obe heuristiky **nikdy neprestrelia** skutočný počet ťahov (5 ≤ 10 ≤ 14) – sú prípustné. Vďaka tomu s nimi A* nájde najkratšiu cestu.
- Manhattan je vždy aspoň taká veľká ako počet nesprávnych kociek → presnejší odhad → A* preskúma menej stavov.
- Dieru (`0`) nikdy nerátaj.
