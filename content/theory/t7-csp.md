# Problémy s ohraničeniami (CSP): backtracking, MRV, LCV, forward checking

Podklad: cvičenie z 9. týždňa (Sudoku – `core/board.py`, `core/solver.py`), prednášky J. Gazdu z roku 2020 „CSP 1“ a „CSP 2“ (z archívu videí 2020; z roku 2026 sú k dispozícii len prednášky k týždňom 7–8 o vyhľadávaní) a štandardné definície z Russell & Norvig (AIMA).

## Čo je CSP

**Problém splnenia ohraničení** (constraint satisfaction problem, CSP) je daný trojicou:

- **premenné** `X1 … Xn` – to, čo treba určiť,
- **domény** `D1 … Dn` – množina hodnôt, ktoré môže každá premenná nadobudnúť,
- **ohraničenia** `C` – ktoré kombinácie hodnôt sú povolené.

| Pojem | Význam |
|---|---|
| priradenie | hodnoty pridelené niektorým (čiastočné) alebo všetkým (úplné) premenným |
| konzistentné priradenie | neporušuje žiadne ohraničenie |
| **riešenie** | priradenie, ktoré je **úplné a zároveň konzistentné** |
| unárne ohraničenie | týka sa jednej premennej (`X ≠ 5`) |
| binárne ohraničenie | týka sa dvojice premenných (`X ≠ Y`) – hrana v grafe ohraničení |
| globálne (n-árne) ohraničenie, ohraničenie vyššieho rádu | týka sa 3 a viac premenných naraz, napr. `alldiff` (všetky rôzne) alebo stĺpec kryptoaritmetiky |
| preferencie (mäkké ohraničenia) | čo je *lepšie*, nie čo je povolené („červená je lepšia ako modrá“) – vedú na optimalizáciu |
| graf ohraničení | vrcholy = premenné, hrany = binárne ohraničenia; **binárny CSP** má iba binárne ohraničenia |

- Ohraničenie možno zapísať **implicitne** (podmienkou, napr. „dámy `Qi`, `Qj` sa neohrozujú“) alebo **explicitne** (výpočtom povolených dvojíc, napr. `(Q1, Q2) ∈ {(1, 3), (1, 4), …}`).
- **Diskrétne premenné** s konečnou doménou: `n` premenných s doménou veľkosti `d` → `O(d^n)` úplných priradení (špeciálny prípad: boolovské CSP). Doména môže byť aj nekonečná (celé čísla, reťazce). **Spojité premenné** vedú na lineárne programovanie.
- Príklady CSP z prednášky: farbenie mapy (Austrália, `D = {red, green, blue}`, susedné štáty rôznou farbou), N-dám, Sudoku, kryptoaritmetika, rozvrhy, hardvérový návrh, doprava (letiská, železničné uzly), detekcia porúch.

### Formulácie N-dám a kryptoaritmetika

| | Formulácia 1 | Formulácia 2 (bežná) |
|---|---|---|
| Premenné | `Xij` pre každé políčko | `Qk` = riadok dámy v stĺpci k |
| Doména | `{0, 1}` (dáma je / nie je) | `{1, 2, …, N}` |
| Ohraničenia | v riadku, stĺpci a na diagonále nesmú byť dve jednotky; `Σ Xij = N` | každá dvojica `(Qi, Qj)` sa neohrozuje |

Druhá formulácia je menšia (`N^N` namiesto `2^(N²)` priradení) a ohraničenie „jedna dáma v stĺpci“ je v nej splnené automaticky – formulácia problému rozhoduje o rýchlosti.

**Kryptoaritmetika `TWO + TWO = FOUR`**: premenné `F, T, U, W, R, O` a pomocné prenosy `X1, X2, X3`; doména `{0, …, 9}`. Ohraničenia: `alldiff(F, T, U, W, R, O)` (vyšší rád) a stĺpce sčítania `O + O = R + 10·X1`, `X1 + W + W = U + 10·X2`, `X2 + T + T = O + 10·X3`, `X3 = F`; navyše `T ≠ 0`, `F ≠ 0`.

### Identifikačné vs. plánovacie problémy

| | Plánovací problém (hľadanie cesty) | Identifikačný problém (CSP) |
|---|---|---|
| Čo je riešenie | **cesta** – postupnosť akcií zo štartu do cieľa | **cieľový stav** – samotné priradenie |
| Záleží na ceste a jej cene? | áno (najkratšia / najlacnejšia) | nie, všetky riešenia sú rovnako dobré |
| Príklady | 8-puzzle, cesta v grafe, navigácia | Sudoku, N-dám, farbenie mapy, rozvrh |
| Typické algoritmy | DFS, BFS, UCS, Greedy, A* | backtracking (+ forward checking, hranová konzistencia), min-conflicts, hill climbing, simulované žíhanie, genetický algoritmus |

> **Na teste:** identifikačné problémy s ohraničeniami riešia backtracking, min-conflicts, hill climbing, simulované žíhanie aj genetický algoritmus. A*, UCS a BFS sú algoritmy na hľadanie **cesty** – medzi algoritmy „s výhodou používané“ na identifikačné problémy sa nepočítajú. Naopak hill climbing a genetické algoritmy sa nepoužívajú na hľadanie cesty v grafe.

## Sudoku ako CSP

| Zložka CSP | Sudoku |
|---|---|
| premenné | 81 buniek `(r, c)`, `r, c ∈ 0..8` |
| domény | `{1, …, 9}`; predvyplnené bunky majú hodnotu danú |
| ohraničenia | 27 × `alldiff`: 9 riadkov, 9 stĺpcov, 9 blokov 3×3 |
| susedia bunky (peers) | 20 buniek: 8 v riadku + 8 v stĺpci + 4 ďalšie v bloku |
| riešenie | všetky bunky vyplnené a žiadne ohraničenie nie je porušené |

V kóde (`SudokuBoard`) je doska `grid` – zoznam 9 zoznamov, **`0` = prázdna bunka** (nepriradená premenná).

| Metóda | Čo robí | Vracia |
|---|---|---|
| `is_valid(r, c, val)` | dá sa `val` vložiť na `(r, c)`? Kontroluje riadok, stĺpec a blok | `True` / `False` |
| `find_empty()` | prvá prázdna bunka po riadkoch zľava doprava | `(r, c)` alebo `None` (doska je plná) |
| `get_domain(r, c)` | hodnoty 1–9, pre ktoré je `is_valid` pravda | zoznam; pre vyplnenú bunku `[]` |
| `copy()` | kópia dosky | nový `SudokuBoard` |

Ľavý horný roh bloku, do ktorého bunka patrí: `block_row = (r // 3) * 3`, `block_col = (c // 3) * 3` (pre `(4, 8)` je to `(3, 6)`).

## Hrubá sila (brute-force DFS)

„Generuj a testuj“: slepé DFS vypĺňa prázdne bunky zľava doprava hodnotami 1..9 **bez akejkoľvek kontroly**. Ohraničenia overí až vtedy, keď je doska plná (`_check_full_board`: každý riadok, stĺpec a blok musí mať 9 rôznych hodnôt – `len(set(row)) != 9` znamená chybu).

```python
for val in range(1, 10):
    self.board.grid[r][c] = val
    self.expanded += 1
    if self._bruteforce_dfs(next_r, next_c):
        return True
self.board.grid[r][c] = 0
return False
```

- Pre `k` prázdnych buniek je až `9^k` úplných dosiek. Doska *easy* má 45 prázdnych buniek → `9^45 ≈ 8,7 · 10^42` možností – nedobehne.
- Použiteľné len na takmer vyplnenej doske. Príklad: prázdne sú `(0,0)` a `(0,1)` so správnymi hodnotami 4 a 3 → 34 priradení (backtracking potrebuje 2).
- Chyba v prvej bunke sa zistí až po vyplnení **všetkých** ostatných.

**Prečo nie BFS nad CSP** (prednáška 2020, AIMA): stav = čiastočné priradenie, štart = prázdne priradenie, akcia = priraď *ľubovoľnej* voľnej premennej *ľubovoľnú* hodnotu. Na 1. úrovni je potom `n · d` uzlov (Austrália: 7 · 3 = 21), na 2. úrovni `(n − 1) · d` z každého … → `n! · d^n` listov, hoci úplných priradení je len `d^n` (Austrália: 5 040 · 2 187 ≈ 1,1 · 10^7 namiesto 2 187). Navyše všetky riešenia ležia v hĺbke `n`, takže BFS by prešlo celý strom. Náprava: priradenia sú **komutatívne** (poradie nezáleží), preto na každej úrovni stačí priraďovať **jedinú** premennú – presne to robí backtracking.

## Backtracking (spätné vyhľadávanie)

Backtracking = DFS s dvoma zlepšeniami oproti hrubej sile:

1. **Jedna premenná v každom kroku** – na poradí priraďovania nezáleží, takže v každej úrovni stromu stačí riešiť jednu premennú.
2. **Kontrola ohraničení priebežne** – skúšajú sa iba hodnoty, ktoré nie sú v konflikte s už priradenými premennými (v Sudoku hodnoty z `get_domain`).

Keď pre premennú nezostane žiadna prípustná hodnota (**slepá ulička, dead end**), algoritmus sa **vráti** k predchádzajúcemu rozhodnutiu, zruší ho (`grid[r][c] = 0`) a skúsi ďalšiu hodnotu.

Všeobecný pseudokód z prednášky (AIMA; prednáška 2020 ho uvádza ako vyžadovaný na skúške):

```text
function RECURSIVE-BACKTRACKING(assignment, csp):
    if assignment je úplné: return assignment
    var ← SELECT-UNASSIGNED-VARIABLE(csp, assignment)        # tu sa zapája MRV
    for each value in ORDER-DOMAIN-VALUES(var, assignment, csp):   # tu LCV
        if value je konzistentná s assignment:
            pridaj {var = value} do assignment
            result ← RECURSIVE-BACKTRACKING(assignment, csp)
            if result ≠ failure: return result
            odober {var = value} z assignment
    return failure
```

Prednáška 2020 poznamenáva, že názov „backtracking“ je trochu zavádzajúci: návrat o úroveň vyššie robí aj obyčajné DFS. Podstatné sú dve zlepšenia vyššie.

```python
def _dfs(self, use_mrv, use_lcv):
    cell = self.board.find_empty()          # výber premennej
    if cell is None:
        return True                         # všetko priradené = riešenie
    r, c = cell
    for val in self.board.get_domain(r, c): # iba konzistentné hodnoty
        self.board.grid[r][c] = val         # priraď
        self.expanded += 1
        if self._dfs(use_mrv, use_lcv):     # rekurzia
            return True
        self.board.grid[r][c] = 0           # návrat (backtrack)
    return False                            # slepá ulička
```

Vlastnosti:

- **úplný** – ak riešenie existuje, nájde ho; ak nie, vráti neúspech,
- časová zložitosť v najhoršom prípade stále exponenciálna `O(d^n)` (`n` premenných, doména veľkosti `d`), v praxi rádovo menej uzlov než hrubá sila,
- pamäť lineárna – hĺbka rekurzie je najviac počet premenných,
- nehľadá „optimálne“ riešenie – v CSP je riešenie buď platné, alebo nie.

`solve_dfs(use_mrv, use_lcv)` vynuluje `expanded`, zavolá `_dfs` a vráti trojicu `(result, expanded, time)`; vyriešená doska zostane v `solver.board.grid`. `expanded` = počet **pokusov o priradenie**.

## Heuristiky poradia: MRV a LCV

Backtracking necháva dve voľby otvorené: **ktorú premennú** priradiť ako ďalšiu a **v akom poradí** skúšať jej hodnoty.

| | MRV – Minimum Remaining Values | LCV – Least Constraining Value |
|---|---|---|
| Odpovedá na otázku | ktorú **premennú** vybrať | v akom poradí skúšať **hodnoty** |
| Pravidlo | premenná s **najmenším počtom zostávajúcich legálnych hodnôt** (najviac obmedzená) | hodnota, ktorá susedným premenným **vylúči najmenej možností** |
| Princíp | *fail-first* – ak má vetva zlyhať, nech zlyhá čo najskôr | *fail-last* – nechať si čo najviac možností, stačí jedno riešenie |
| V kóde | `select_unassigned_mrv()` → `((r, c), domain)` | `sort_values_lcv(r, c, domain)` → zoradená doména |
| Bez heuristiky | `find_empty()` – prvá prázdna bunka | hodnoty vzostupne 1..9 |

- MRV v kóde: prejde všetky prázdne bunky, pre každú zavolá `get_domain` a zapamätá si tú s najkratšou doménou. Porovnanie je ostré (`len(domain) < len(best_domain)`), takže pri zhode vyhrá **prvá** nájdená bunka (po riadkoch). Ak je doska plná, vráti `(None, None)`.
- Ak MRV nájde bunku s **prázdnou doménou**, vyberie ju hneď – cyklus cez hodnoty neprebehne a vetva okamžite zlyhá.
- Pri zhode v MRV sa v teórii používa *degree heuristic* – premenná zapojená do najväčšieho počtu ohraničení s nepriradenými premennými.
- Heuristiky nemenia úplnosť ani výsledok, iba **poradie prehľadávania**, a tým počet expandovaných uzlov.

> **Pozor – LCV v kóde z cvičenia:** `sort_values_lcv` zozbiera 20 susedov bunky (`peers`), pre každú hodnotu spočíta **prázdnych** susedov, do ktorých sa táto hodnota nedá vložiť (`not is_valid(rr, cc, val)` → `score += 1`), a doménu zoradí **vzostupne** podľa skóre: `sorted(domain, key=lambda v: value_scores[v])`. Učebnicová definícia počíta, koľko možností by hodnota susedom **odobrala**. Pri otázke na princíp LCV odpovedaj definíciou („najmenej obmedzujúca hodnota“), pri otázke na kód čítaj, čo naozaj počíta `score`.

## Filtrovanie domén: forward checking

**Forward checking (dopredná kontrola)**: po každom priradení `X = v` sa z domén **nepriradených susedov** premennej `X` odstránia hodnoty nekonzistentné s `v`. Ak niektorá doména zostane **prázdna**, vetva sa ukončí hneď – netreba čakať, kým na tú premennú príde rad.

V cvičení sa domény neukladajú, počítajú sa z dosky. Forward checking je preto test po priradení: *má každá prázdna bunka aspoň jednu legálnu hodnotu?*

```python
self.board.grid[r][c] = val
ok = all(self.board.get_domain(rr, cc)
         for rr in range(9) for cc in range(9)
         if self.board.grid[rr][cc] == 0)
if ok and self._fc(use_mrv, use_lcv):
    return True
self.board.grid[r][c] = 0
```

Obmedzenie: forward checking kontroluje iba vzťah **priradená premenná → jej nepriradení susedia**. Nezistí konflikt medzi dvoma nepriradenými premennými.

> **Príklad (farbenie mapy Austrálie):** WA = červená, Q = zelená. Forward checking zúži NT aj SA na `{modrá}` a pokračuje – žiadna doména nie je prázdna. NT a SA však susedia, takže obe modré byť nemôžu. Túto chybu odhalí až hranová konzistencia.

## Hranová konzistencia (arc consistency, AC-3)

Hrana `X → Y` je **konzistentná**, ak pre **každú** hodnotu `x` z domény `X` existuje **aspoň jedna** hodnota `y` v doméne `Y`, ktorá spolu s `x` spĺňa ohraničenie. Nekonzistentná hrana sa opraví odstránením hodnôt bez podpory **z domény `X`** (chvost hrany).

Algoritmus **AC-3**:

1. Do frontu vlož všetky hrany CSP (oba smery každého binárneho ohraničenia).
2. Vyber hranu `X → Y` a odstráň z `D(X)` hodnoty, ktoré nemajú podporu v `D(Y)`.
3. Ak sa `D(X)` zmenšila, vráť do frontu všetky hrany `Z → X` (susedia `X`) – mohli stratiť podporu.
4. Ak je `D(X)` prázdna → zlyhanie (žiadne riešenie v tejto vetve). Skonči, keď je front prázdny.

Príklad: `X, Y ∈ {1, 2, 3}`, ohraničenie `X < Y`. Hrana `X → Y` odstráni `3` z `X`, hrana `Y → X` odstráni `1` z `Y`. Výsledok: `X ∈ {1, 2}`, `Y ∈ {2, 3}`. Z prednášky 2020: s treťou premennou `C ∈ {1, 2, 3}` a ohraničením `B = C` sa po zúžení `B` vráti do frontu hrana `C → B` a odstráni `1` aj z `C` → `A {1, 2}`, `B {2, 3}`, `C {2, 3}`.

Demo z prednášky 2020 (overené kódom): 5 dám, riadky Q1…Q5, po priradení **Q1 = 1, Q2 = 3** zúži AC-3 všetky ostatné domény na jedinú hodnotu (Q3 = 5, Q4 = 2, Q5 = 4) – riešenie je hotové bez ďalšieho hľadania.

Odkiaľ je `O(e · d³)`: kontrola jednej hrany porovná každú hodnotu s každou (`d²`); hrana sa môže do frontu vrátiť najviac `d`-krát (zakaždým ubudne aspoň jedna hodnota); hrán je `e`.

Charakteristiky:

- **zmenšuje prehľadávaný priestor** odstránením nekonzistentných hodnôt z domén premenných,
- sama riešenie nehľadá a nič negarantuje: po AC-3 môžu doménam zostať viaceré hodnoty a riešenie stále nemusí existovať; nenájde ani „optimálne“ riešenie,
- používa sa ako predspracovanie alebo po každom priradení počas backtrackingu (MAC – *maintaining arc consistency*),
- je silnejšia než forward checking (odhalí zlyhanie skôr), ale drahšia na jeden uzol – zložitosť AC-3 je `O(e · d³)` (`e` hrán, doména veľkosti `d`), pamäť (front hrán) `O(e)`.
- Po AC-3 môže CSP mať **jedno, viac alebo žiadne** riešenie – hranová konzistencia to sama nerozlíši.

### K-konzistencia

| Úroveň | Význam |
|---|---|
| **1-konzistencia** (node consistency) | každá premenná spĺňa svoje **unárne** ohraničenia |
| **2-konzistencia** (arc consistency) | pre každú hodnotu jednej premennej existuje kompatibilná hodnota druhej |
| **3-konzistencia** (path consistency) | každé konzistentné priradenie dvoch premenných sa dá rozšíriť na tretiu |
| **k-konzistencia** | každé konzistentné priradenie `k − 1` premenných sa dá rozšíriť na `k`-tú |
| **silná k-konzistencia** | je k-, (k−1)-, …, 1-konzistentné súčasne |

- Príklad, kde hranová konzistencia nestačí (prednáška 2020, AIMA): tri navzájom susediace premenné `X1, X2, X3`, každá s doménou `{červená, modrá}`, všetky rôzne. Každá hrana je konzistentná (k červenej sa vždy nájde modrá), AC-3 teda nič neodstráni – a predsa riešenie **neexistuje**. Path consistency to odhalí: priradenie `X1 = modrá, X2 = červená` sa nedá rozšíriť na `X3`.
- Čím vyššie `k`, tým silnejšie orezávanie, ale aj **vyššia zložitosť** vynútenia konzistencie. V praxi sa používa najviac hranová, výnimočne path consistency.
- **Silná n-konzistencia** (n = počet premenných) zaručí, že riešenie sa nájde **bez backtrackingu**: vyber hodnotu 1. premennej (unárne OK), 2-konzistencia zaručí povolenú hodnotu 2. premennej, 3-konzistencia povolenú hodnotu 3., atď.
- **Na skúške** (poradie podľa počtu backtrackov, od najviac po najmenej): **naivné DFS > forward checking > hranová konzistencia > 3-konzistencia**.

## Štruktúra problému

Ako zrýchliť CSP využitím tvaru grafu ohraničení:

- **Nezávislé podproblémy** (napr. Tasmánia je od pevninskej Austrálie oddelená): ak sa graf s `n` premennými rozpadne na časti po `c` premenných, zložitosť je `O((n/c) · d^c)` – **lineárna v n**. Príklad: `n = 80`, `d = 2`, `c = 20` → `2^80` stavov by trvalo asi 4 miliardy rokov pri 10 miliónoch uzlov za sekundu (slajd uvádza „4 milióny rokov“, správne je ≈ 3,8 · 10^9), `4 · 2^20` stavov asi 0,4 s.
- **CSP v tvare stromu** (graf bez cyklov) sa dá vyriešiť v čase **`O(n · d²)`** namiesto všeobecného `O(d^n)`:
  1. zvoľ koreň a zoraď premenné tak, aby každý rodič bol pred svojimi deťmi,
  2. **spätný chod**: pre `i = n … 2` urob hranu `Parent(Xi) → Xi` konzistentnou (odstráň hodnoty z domény rodiča),
  3. **dopredný chod**: pre `i = 1 … n` priraď `Xi` hodnotu konzistentnú s rodičom – **nikdy sa nevracia**.
  - Tvrdenie 1: po spätnom chode sú všetky hrany konzistentné (domény potomkov sa už nemenia). Tvrdenie 2: ak sú všetky hrany stromu konzistentné, dopredný chod nikdy nebacktrackuje (dôkaz indukciou).
- **Takmer stromové CSP – podmienenie (cutset conditioning)**: vyber množinu premenných (**cutset**, veľkosť `c`), po ktorej odstránení ostane strom (pri Austrálii stačí SA). Pre každé priradenie cutsetu prefiltruj domény a zvyšok vyrieš stromovým algoritmom → `O(d^c · (n − c) · d²)`, rýchle pre malé `c`.
- **Dekompozícia stromu (tree decomposition)**: vytvor strom z **mega-premenných**; každá obsahuje časť pôvodného CSP (podproblém). Podproblémy sa prekrývajú a susedné sa musia zhodnúť na spoločných premenných.

## Porovnanie: hrubá sila vs. backtracking vs. forward checking

| | Brute-force DFS | Backtracking | Backtracking + forward checking |
|---|---|---|---|
| Kedy kontroluje ohraničenia | až na úplnej doske | pri každom priradení, proti už priradeným | pri každom priradení + pozerá dopredu na domény |
| Aké hodnoty skúša | všetky 1..9 | iba z `get_domain` | iba z `get_domain` |
| Kedy zistí slepú uličku | po vyplnení všetkých buniek | keď príde na rad bunka bez hodnoty | hneď po priradení, ktoré ju spôsobilo |
| Počet uzlov | až `9^k` | výrazne menej | ešte menej (pri rovnakom poradí premenných) |
| Práca na jeden uzol | minimálna | výpočet domény | výpočet domén všetkých prázdnych buniek |
| V kóde | `solve_bruteforce_dfs` / `_bruteforce_dfs` | `solve_dfs` / `_dfs` | `solve_forward_checking` / `_fc` |
| Úplnosť | áno (teoreticky) | áno | áno |

Počet expandovaných uzlov s referenčným riešením (orientačne – závisí od implementácie):

| Doska | DFS | DFS + MRV | FC | FC + MRV |
|---|---|---|---|---|
| easy (45 prázdnych) | 54 | 45 | 50 | 45 |
| medium (57 prázdnych) | 2 250 | 1 138 | 921 | 1 138 |
| hard (57 prázdnych) | 8 892 | 215 | 5 138 | 215 |

- Forward checking zníži počet uzlov oproti čistému DFS; MRV pomáha najviac na ťažkej doske.
- S MRV má FC rovnaký počet uzlov ako DFS: MRV vyberie bunku s prázdnou doménou ako prvú, takže slepú uličku odhalí hneď v nasledujúcom volaní aj bez dopredného testu.
- `expanded = 45` na doske s 45 prázdnymi bunkami znamená, že sa algoritmus nevracal ani raz.

### Čo znižuje počet návratov (backtrackov)

- samotný **algoritmus spätného vyhľadávania** oproti naivnému DFS (kontroluje ohraničenia priebežne),
- **forward checking** – orezáva vetvy hneď po priradení,
- **hranová konzistencia** – orezáva ešte skôr,
- vhodné poradie: **MRV** (premenné) a **LCV** (hodnoty).

Naivné DFS (hrubá sila) počet návratov neznižuje.

## Min-conflicts – lokálne vyhľadávanie pre CSP

Iný prístup: nezačínať z prázdneho priradenia, ale z **úplného** (každá premenná má hodnotu, ohraničenia môžu byť porušené), a postupne ho **opravovať**.

```python
def min_conflicts(csp, max_steps):
    current = nahodne_uplne_priradenie(csp)
    for _ in range(max_steps):
        if je_riesenie(current):
            return current
        var = random.choice(premenne_v_konflikte(current))
        current[var] = hodnota_s_najmenej_konfliktmi(var, current)
    return None
```

- V každej iterácii vyberie **ľubovoľnú (náhodnú) premennú, ktorá je v konflikte**, a zmení jej hodnotu na tú z domény, ktorá porušuje **najmenej** ohraničení (zhody náhodne).
- Je to **algoritmus lokálneho vyhľadávania** (iteratívne zlepšovanie), určený na **identifikačné problémy s ohraničeniami**.
- Nie je úplný – môže uviaznuť na planine alebo v lokálnom minime; nepamätá si strom ani navštívené stavy.
- Je veľmi efektívny aj pre **obrovské** priestory: problém milióna dám vyrieši priemerne asi za 50 krokov.
- Príklad (4 dámy, `queens = (1, 3, 0, 3)`, konflikt stĺpcov 1 a 3): pre dámu v stĺpci 3 sú počty konfliktov v riadkoch 0..3 `[1, 3, 0, 1]` → presunie sa do riadku 2 → `(1, 3, 0, 2)`, riešenie.

> **Pozor:** min-conflicts **nevyberá** premennú s najväčším počtom konfliktov (vyberá ľubovoľnú konfliktnú), **nezačína** zo stavu s minimálnym počtom konfliktov (štart je náhodný) a neplatí, že je vhodný len pre malé priestory.
>
> Prednáška 2020 pripúšťa pri výbere premennej aj variant „premenná s najväčším počtom konfliktov“. Testové karty (Quizlet) však tvrdenie „vyberá premennú s najviac konfliktmi“ hodnotia ako **nesprávne** – na teste odpovedaj podľa nich: ľubovoľná (náhodná) konfliktná premenná.

- Formulácia pre 4 dámy z prednášky: stavy = 4 dámy v 4 stĺpcoch (`4^4 = 256` stavov), akcia = posuň dámu v jej stĺpci, cieľ = žiadne útoky, evaluačná funkcia `h(n)` = počet útokov (konfliktov).
- Lokálne vyhľadávanie rieši N-dám takmer v konštantnom čase aj pre `n = 10 000 000`.
- Výnimka: problémy blízko **kritického pomeru** `R = počet ohraničení / počet premenných`. Pri malom R je problém ľahký (málo ohraničení), pri veľkom tiež (rýchlo vidno nesplniteľnosť); v úzkom pásme okolo kritického R čas výpočtu prudko vyskočí.

## Typické chytáky

- MRV vyberá **premennú**, LCV radí **hodnoty** – nezameniť.
- MRV = najmenej zostávajúcich hodnôt = **najviac** obmedzená premenná; LCV = **najmenej** obmedzujúca hodnota.
- Forward checking ≠ hranová konzistencia: FC pozerá len na susedov práve priradenej premennej.
- Hranová konzistencia odstraňuje hodnoty z domény `X` pri hrane `X → Y`, nie z `Y`.
- Backtracking je úplný, ale stále exponenciálny; heuristiky a filtrovanie menia rýchlosť, nie výsledok.
- Brute force kontroluje ohraničenia iba na úplnom priradení; backtracking pri každom priradení.
- `find_empty()` vracia `None`, keď je doska plná – to je ukončovacia podmienka rekurzie (`return True`).
- `get_domain` vyplnenej bunky je `[]`, nie `[hodnota]`.
- Silná n-konzistencia = riešenie bez backtrackingu; počet backtrackov: DFS > forward checking > hranová konzistencia > 3-konzistencia.
- Stromové CSP je `O(n · d²)` (lineárne v n), všeobecné CSP `O(d^n)`.
- Po neúspešnej rekurzii treba bunku **vynulovať**, inak zostane na doske chybná hodnota.

## Rýchle zhrnutie

- CSP = premenné + domény + ohraničenia; riešenie = úplné a konzistentné priradenie.
- CSP je identifikačný problém: záleží na cieľovom stave, nie na ceste.
- Sudoku: 81 premenných, doména 1–9, 27 ohraničení `alldiff`, každá bunka má 20 susedov.
- Brute force: vyplň všetko, skontroluj až na konci – až `9^k` dosiek.
- Backtracking = DFS + jedna premenná na úroveň + priebežná kontrola ohraničení; pri slepej uličke sa vráti a skúsi inú hodnotu.
- MRV: vyber premennú s najmenšou doménou (fail-first).
- LCV: skúšaj najprv hodnotu, ktorá najmenej obmedzí susedov.
- Forward checking: po priradení skontroluj domény nepriradených; prázdna doména = okamžitý návrat.
- Hranová konzistencia (AC-3): `X → Y` je konzistentná, ak každé `x` má podporu v `D(Y)`; zmenšuje domény, negarantuje riešenie.
- Počet návratov znižujú: backtracking oproti naivnému DFS, forward checking, hranová konzistencia, MRV/LCV.
- Min-conflicts: lokálne vyhľadávanie z úplného priradenia; náhodná konfliktná premenná dostane hodnotu s najmenej konfliktmi.
- Ohraničenia: unárne, binárne, vyššieho rádu, preferencie; k-konzistencia: 1 = node, 2 = arc, 3 = path (vyššie k = viac orezania, vyššia zložitosť).
- Štruktúra: nezávislé podproblémy `O((n/c) · d^c)`, strom `O(n · d²)`, cutset conditioning `O(d^c · (n − c) · d²)`, dekompozícia stromu na mega-premenné.
- Identifikačné CSP: backtracking, min-conflicts, hill climbing, simulované žíhanie, genetický algoritmus; cesta v grafe: DFS, BFS, UCS, Greedy, A*.
- `solve_dfs` / `solve_forward_checking` vracajú `(result, expanded, time)`.
