**O čo ide:** obyčajný backtracking zistí, že je v slepej uličke, až keď do nej naozaj dôjde. **Forward checking (kontrola dopredu)** sa po každom zapísanom čísle pozrie na ostatné prázdne bunky: **ostala niektorej z nich prázdna doména?** Ak áno, toto číslo nemá zmysel ďalej rozvíjať – hneď ho vygumujeme.

Kód je backtracking `_dfs` s jedinou vloženou kontrolou. Ak vieš `_dfs`, tu sa učíš len štyri riadky.

### Krok za krokom

**Rovnaké ako `_dfs`:** výber bunky (`select_unassigned_mrv` alebo `find_empty`), `if cell is None: return True`, doména, voliteľné zoradenie `sort_values_lcv`, potom `for val in domain:` a zápis čísla `self.board.grid[r][c] = val`.

**Nové – kontrola dopredu** hneď po zapísaní čísla:

```python
ok = all(self.board.get_domain(rr, cc)
         for rr in range(9) for cc in range(9)
         if self.board.grid[rr][cc] == 0)
```

Čítaj to odzadu:

1. `for rr in range(9) for cc in range(9) if self.board.grid[rr][cc] == 0` – pre každú **prázdnu** bunku dosky,
2. `self.board.get_domain(rr, cc)` – zisti jej doménu. Prázdny zoznam `[]` sa v Pythone počíta ako `False`, neprázdny ako `True`,
3. `all(...)` – je `True`, len ak sú **všetky** domény neprázdne.

Teda `ok` znamená: „každá prázdna bunka má ešte aspoň jednu možnosť“.

**Nové – podmienka pred rekurziou:** `if ok and self._fc(use_mrv, use_lcv): return True` – do rekurzie ideme, **len ak** kontrola prešla. Keď je `ok` nepravda, `and` druhú časť ani nevyhodnotí – ušetríme celé zbytočné hľadanie.

**Rovnaké ako `_dfs`:** `self.board.grid[r][c] = 0` – vygumuj a skús ďalšie číslo; na konci `return False` – nič nevyšlo.

### Ako si to zapamätať

- `_fc` = `_dfs` + riadok `ok = all(...)` + `if ok and ...`.
- Forward checking nemení výsledok, len **skôr odreže** zlé vetvy → menej pokusov (na ťažkej doske 5138 namiesto 8892).
- Pozerá sa len o jeden krok dopredu: zistí prázdnu doménu, ale nie zložitejšie konflikty medzi dvoma bunkami.

> **Pozor:** riešenie `_fc` nie je oficiálne – je doplnené podľa komentárov v študentskej verzii kódu.
