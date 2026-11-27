**O čo ide:** bunku už máme vybranú a vieme, ktoré čísla do nej smú ísť. LCV (Least Constraining Value) rieši, **v akom poradí ich skúšať**. Každému číslu vypočíta skóre podľa okolitých buniek a zoradí čísla od najmenšieho skóre.

Kód má tri časti – sú v ňom označené komentármi `1)`, `2)`, `3)`.

### 1) Kto sú susedia bunky

Susedia (`peers`) sú všetky bunky, ktoré s našou bunkou zdieľajú riadok, stĺpec alebo štvorec.

1. `peers = set()` – množina, takže sa žiadna bunka nezapočíta dvakrát.
2. `for i in range(9):` – naraz riadok aj stĺpec:
    - `if i != c: peers.add((r, i))` – bunky v **riadku** `r` okrem našej,
    - `if i != r: peers.add((i, c))` – bunky v **stĺpci** `c` okrem našej.
3. `block_r = (r // 3) * 3`, `block_c = (c // 3) * 3` – roh štvorca (rovnaký vzorec ako v `is_valid`).
4. Dva cykly cez štvorec a `if (rr, cc) != (r, c): peers.add((rr, cc))` – bunky **štvorca** okrem našej.

### 2) Skóre každého čísla

1. `for val in domain:` – pre každé číslo, ktoré prichádza do úvahy, `score = 0`.
2. `for (rr, cc) in peers:` – prejdi susedov.
3. `if self.board.grid[rr][cc] != 0: continue` – vyplnených susedov preskoč, zaujímajú nás len prázdni.
4. `if not self.board.is_valid(rr, cc, val): score += 1` – ak sused toto číslo **dostať nemôže**, pripočítaj bod.
5. `value_scores[val] = score` – ulož skóre do slovníka.

### 3) Zoradenie

`return sorted(domain, key=lambda v: value_scores[v])` – zoradí čísla podľa skóre **od najmenšieho**. `key` hovorí, podľa čoho triediť; `lambda v: value_scores[v]` je krátka funkcia „pre číslo `v` vráť jeho skóre“.

### Ako si to zapamätať

- Tri bloky: **susedia → skóre → `sorted`**.
- Susedia = riadok + stĺpec + štvorec, vždy bez samotnej bunky.

> **Pozor:** kód z cvičenia počíta susedov, ktorí hodnotu **nemôžu** dostať. Učebnicová LCV počíta tých, ktorým by sme hodnotu **zobrali** (teda ktorí ju dostať môžu), a vyberá číslo, ktoré zoberie najmenej. Na teste ber teóriu podľa učebnice a kód podľa cvičenia – viac v podrobnostiach nižšie.
