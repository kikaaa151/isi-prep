**O čo ide:** hlavolam s posuvnými kockami (8-puzzle). Prázdne miesto je `0`. Tieto dve metódy hovoria, **aké ťahy sú možné** a **ako vyzerá doska po ťahu**. Bez nich by žiadny vyhľadávací algoritmus nevedel, kam sa dá zo stavu ísť.

Príklad dosky – `self.board`:

```
1 2 3
4 0 6
7 5 8
```

Prázdne miesto je v riadku 1, stĺpci 1 → `self._blank_pos = (1, 1)`.

### `get_possible_moves` – ktoré kocky sa dajú posunúť

1. `r, c = self._blank_pos` – riadok a stĺpec prázdneho miesta.
2. `for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:` – štyri smery: hore, dole, vľavo, vpravo. `dr` je zmena riadku, `dc` zmena stĺpca.
3. `nr, nc = r + dr, c + dc` – súradnice suseda prázdneho miesta v danom smere.
4. `if 0 <= nr < self.size and 0 <= nc < self.size:` – je sused ešte na doske? (V rohu sú len dvaja susedia.)
5. `moves.append(self.board[nr][nc])` – ak áno, zapíšeme **číslo kocky**, ktorá tam leží. Tá sa dá posunúť do diery.
6. Pre dosku vyššie vráti `[2, 5, 4, 6]`.

### `move_tile` – sprav ťah

1. Znova prejde štyroch susedov diery a hľadá toho, kde leží kocka `tile`.
2. `new_board = [row[:] for row in self.board]` – **kópia** dosky. `row[:]` skopíruje riadok. Pôvodný stav sa nesmie zmeniť – ešte ho budeme potrebovať.
3. `new_board[r][c], new_board[nr][nc] = new_board[nr][nc], new_board[r][c]` – výmena dvoch políčok: kocka ide do diery, diera na miesto kocky.
4. `return PuzzleState(new_board, parent=self, moved_tile=tile)` – vráti **nový stav**. `parent=self` si pamätá, odkiaľ sme prišli – na konci sa tak dá spätne poskladať celá cesta.
5. `raise ValueError(...)` – ak kocka `tile` nie je vedľa diery, ťah nie je možný.

### Ako si to zapamätať

- Štyri smery `(-1, 0), (1, 0), (0, -1), (0, 1)` + kontrola hraníc – tento vzor je v každej úlohe na mriežke.
- Ťah nikdy nemení pôvodný stav: **kópia → výmena → nový stav s rodičom**.
