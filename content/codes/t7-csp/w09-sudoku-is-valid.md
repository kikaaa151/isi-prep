**O čo ide:** pravidlá Sudoku v kóde. Metóda odpovie na otázku: **smiem do bunky v riadku `r` a stĺpci `c` napísať číslo `val`?** Smiem, ak to číslo ešte nie je v tom istom riadku, stĺpci ani v štvorci 3 × 3.

Doska je `self.grid` – zoznam 9 riadkov, každý riadok je zoznam 9 čísel. `0` znamená prázdnu bunku. Bunka sa číta `self.grid[riadok][stĺpec]`.

### Krok za krokom

1. **Riadok:** `if val in self.grid[r]:` – `self.grid[r]` je celý riadok ako zoznam, takže stačí operátor `in`. Ak tam číslo už je → `return False`.
2. **Stĺpec:** stĺpec nie je uložený ako jeden zoznam, musíme ho prejsť: `for i in range(9):` a `if self.grid[i][c] == val:` – mení sa riadok `i`, stĺpec `c` ostáva. Nájdené → `return False`.
3. **Štvorec 3 × 3:** najprv treba zistiť, kde štvorec začína:
    - `block_row = (r // 3) * 3` – celočíselné delenie tromi a späť krát tri „zaokrúhli“ riadok nadol na 0, 3 alebo 6,
    - `block_col = (c // 3) * 3` – to isté pre stĺpec.
    - Príklad: bunka `(4, 7)` → `(4 // 3) * 3 = 3`, `(7 // 3) * 3 = 6` → štvorec začína na `(3, 6)`.
4. `for i in range(block_row, block_row + 3):` a vnútri `for j in range(block_col, block_col + 3):` – dva cykly prejdú 9 buniek štvorca. `if self.grid[i][j] == val:` → `return False`.
5. `return True` – prešli všetky tri kontroly, číslo sa tam dať môže.

### Ako si to zapamätať

- Tri kontroly v tomto poradí: **riadok (`in`) → stĺpec (jeden cyklus) → štvorec (dva cykly)**.
- Vzorec na roh štvorca: `(x // 3) * 3`.
- Akonáhle sa nájde zhoda, hneď `return False`. `return True` je až úplne na konci.
- V jazyku CSP: bunky sú premenné, čísla 1–9 hodnoty a táto metóda kontroluje ohraničenia.
