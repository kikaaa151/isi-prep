**O čo ide:** úloha N dám – postaviť N dám na šachovnicu N × N tak, aby sa žiadne dve neohrozovali. Táto metóda meria, **aký zlý je stav**: počíta dvojice dám, ktoré sa ohrozujú. `0` = vyriešené. Všetky algoritmy lokálneho vyhľadávania sa snažia toto číslo znížiť.

**Ako je doska uložená:** `self.queens` je rad čísel, kde **pozícia = stĺpec** a **hodnota = riadok** dámy. Napríklad `(1, 3, 0, 2)`: dáma v stĺpci 0 je v riadku 1, v stĺpci 1 v riadku 3… V každom stĺpci je teda vždy práve jedna dáma – v stĺpcoch sa ohrozovať nemôžu. Ostávajú **riadky a dve uhlopriečky**.

### `_line_counts` – koľko dám je na ktorej čiare

1. `rows, diag, anti = [0] * n, [0] * (2 * n - 1), [0] * (2 * n - 1)` – tri zoznamy počítadiel: pre `n` riadkov a pre `2n − 1` uhlopriečok každého smeru.
2. `for c, r in enumerate(self.queens):` – prejdi dámy: `c` je stĺpec, `r` riadok.
3. `rows[r] += 1` – v riadku `r` pribudla dáma.
4. `diag[r - c + n - 1] += 1` – na jednej uhlopriečke majú všetky políčka **rovnaký rozdiel** `r − c`. Pripočítanie `n − 1` len posunie index, aby nebol záporný.
5. `anti[r + c] += 1` – na uhlopriečke opačného smeru majú políčka **rovnaký súčet** `r + c`.

### `conflicts` – z počtov spraví počet dvojíc

1. `if self._conflicts is None:` – výsledok sa počíta len raz a potom si ho stav pamätá (šetrí čas).
2. `rows, diag, anti = self._line_counts()` – počty dám na čiarach.
3. `sum(k * (k - 1) // 2 for counts in (rows, diag, anti) for k in counts)` – pre každú čiaru, na ktorej je `k` dám, pripočítaj počet dvojíc: `k * (k − 1) / 2`.
    - 1 dáma → 0 dvojíc, 2 dámy → 1 dvojica, 3 dámy → 3 dvojice.

### Príklad

`(0, 1, 2, 3)` – všetky štyri dámy na jednej uhlopriečke → `4 * 3 / 2 = 6` konfliktov. `(1, 3, 0, 2)` → 0 konfliktov, riešenie.

### Ako si to zapamätať

- Rovnaký riadok → `rows[r]`, rovnaký rozdiel → `diag[r - c + n - 1]`, rovnaký súčet → `anti[r + c]`.
- Z počtu dám na čiare na počet dvojíc: `k * (k - 1) // 2`.
- Táto funkcia je heuristika `h` lokálneho vyhľadávania: čím menšia, tým lepší stav.
