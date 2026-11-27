**O čo ide:** MRV (Minimum Remaining Values) odpovedá na otázku **„ktorú bunku vyplniť ako ďalšiu?“** Odpoveď: tú, do ktorej sa dá dať **najmenej čísel**. Ak má bunka jedinú možnosť, niet čo hádať; a ak nemá žiadnu, čím skôr na to prídeme, tým lepšie.

Človek to robí rovnako – hľadá políčko, kde „ide už len jedno číslo“.

### Krok za krokom

1. `best_cell = None`, `best_domain = None` – zatiaľ sme nič nenašli.
2. `for r in range(9):` a `for c in range(9):` – prejdeme všetkých 81 buniek.
3. `if self.board.grid[r][c] == 0:` – zaujímajú nás len **prázdne** bunky.
4. `domain = self.board.get_domain(r, c)` – čísla, ktoré do tejto bunky smú ísť.
5. `if best_cell is None or len(domain) < len(best_domain):` – je to prvá nájdená bunka, alebo má **menej** možností než doterajší rekordér?
    - `best_cell = (r, c)` – zapamätaj si jej polohu,
    - `best_domain = domain` – aj jej doménu.
6. `return best_cell, best_domain` – vráti **dve veci**: bunku a jej doménu (aby ju backtracking nemusel počítať znova). Ak je doska plná, vráti `None, None`.

### Ako si to zapamätať

- Je to obyčajné **hľadanie minima**: „doteraz najlepší“ + cyklus + `if menší: zapamätaj`.
- Porovnáva sa `len(domain)` – počet možností.
- Ostré `<` znamená, že pri rovnosti vyhráva bunka nájdená skôr (viac hore a vľavo).
- MRV vyberá **premennú** (bunku). LCV zoraďuje **hodnoty** (čísla). Nepopleť.
