# Vyhľadávanie: DFS, BFS, UCS, Greedy, A* a heuristiky

Zdroje: prednáška J. Gazdu z roku 2026 „Vyhľadávanie bez informácie“ (týždne 7–8), prednášky z roku 2020 (vyhľadávanie s informáciou), cvičenia 7 a 8 (Loydova osmička, anglicky 8-puzzle), pseudokódy z Moodlu a kniha Russell & Norvig: *Artificial Intelligence: A Modern Approach* (AIMA, kap. 2–3). Príklady s Pacmanom a tabuľky uzlov pochádzajú z kurzu CS188 (UC Berkeley), z ktorého prednášky vychádzajú.

> Odporúčanie cvičiaceho: vizualizácia [PathFinding.js](https://qiao.github.io/PathFinding.js/visual/) – nakresli prekážku medzi štart a cieľ a sleduj, ktoré políčka algoritmus expanduje a akú cestu nájde. Porovnaj Breadth-First-Search (BFS), Dijkstra (= UCS), Best-First-Search (= Greedy) a `A*`; voľba *Bi-directional* zapne obojsmerné hľadanie. DFS tam nie je – skús si ho v GUI z cvičenia.

## Agenty

**Agent** vníma prostredie (senzory → vnemy) a koná v ňom (akcie).

| Agent | Ako sa rozhoduje |
|---|---|
| **Reflexný agent** | Iba podľa **aktuálneho vnemu / aktuálneho stavu** (pravidlá „podmienka → akcia“). Neuvažuje o budúcich dôsledkoch akcií, nič neplánuje, nepamätá si históriu. Negarantuje úplnosť ani optimálnosť. |
| Reflexný agent s modelom | Udržiava si vnútorný stav (model sveta), ale stále reaguje pravidlami. |
| **Plánujúci (cieľový) agent** | Má **cieľ** a **model** toho, ako akcie menia svet. Pred konaním si „v hlave“ skúša postupnosti akcií a ich dôsledky – to je **vyhľadávanie**. |
| Agent založený na úžitku | Okrem cieľa porovnáva, *ako dobré* sú jednotlivé stavy (funkcia úžitku). |
| Učiaci sa agent | Zlepšuje svoje správanie zo skúseností. |

**Racionálny agent** volí akciu, ktorá **maximalizuje očakávaný úžitok** (očakávanú hodnotu miery výkonu) vzhľadom na to, čo doteraz vnímal a čo vie. Racionálny neznamená vševediaci ani neomylný a nie je to to isté ako „učiaci sa“ alebo „logicky uvažujúci“.

- **Agentová funkcia** (agent function) = matematický popis: zobrazenie z **postupnosti vnemov** na akciu (dá sa predstaviť ako tabuľka). **Agentový program** = jej konečná implementácia, ktorá beží na konkrétnom stroji.
- V deterministickom prostredí agent maximalizuje úžitok priamo, v stochastickom **očakávaný** úžitok (strednú hodnotu).
- Racionalita **nie je vlastnosť samotného agenta**. Podľa prednášky závisí od štyroch vecí: **miera úžitku** (kritérium úspechu – zadávame ju my), **vstavaná znalosť prostredia** (mapa, prechodový model), **množina dostupných akcií** a **doterajšia postupnosť vnemov**. Stačí zmeniť mieru úžitku alebo senzory a ten istý program prestane byť racionálny. (Prednášajúci v roku 2026 povedal, že na tento rozpis sa pýtať nebude.)
- **Môže byť reflexný agent racionálny?** Áno – ale iba ak aktuálny vnem obsahuje dosť informácie na optimálnu akciu. Vo vysávačovom svete áno, v Pacmanovi nie (reflexný agent sa zasekne medzi dvoma políčkami).
- Cieľový agent rozlišuje iba cieľ / necieľ → stačí na nájdenie riešenia (zodpovedá mu **BFS, DFS, IDS**). Úžitkový agent priraďuje stavom číslo a vie povedať, ktoré riešenie je lepšie (**UCS, `A*`, greedy**). Učiaci sa agent sa učí online interakciou s prostredím (**Q-learning, SARSA**).

**Vysávačový svet** (vacuum world): dve miesta A, B, každé čisté alebo špinavé; akcie vľavo, vpravo, vysávaj → **8 stavov** (2 polohy × 4 konfigurácie špiny). Agent „stále sa presúvaj a vysávaj“ je racionálny, kým nie je penalizácia za pohyb; s penalizáciou už nie.

**PEAS** – špecifikácia úlohy (príklad autonómne taxi):

| Zložka | Autonómne taxi |
|---|---|
| **P**erformance (miera úžitku) | bezpečnosť, rýchlosť, dodržanie predpisov, pohodlie, zisk |
| **E**nvironment (prostredie) | cesta, ostatná doprava, chodci, zákazníci, počasie |
| **A**ctuators (akčné členy) | volant, plyn, brzda, smerovky, displej |
| **S**ensors (senzory) | kamery, radar, lidar, GPS, tachometer, akcelerometre |

### Prostredie: sedem dimenzií

| Dimenzia | Otázka |
|---|---|
| plne / čiastočne **pozorovateľné** | dávajú senzory úplný stav prostredia? |
| **jeden / viac agentov** | a ak viac – spolupracujú, alebo súperia (min-max)? |
| **deterministické / stochastické** | je ďalší stav úplne určený stavom a akciou? |
| **epizodické / sekvenčné** | je každé rozhodnutie samostatné (kontrola výrobku), alebo ovplyvní ďalšie (ťah v šachu)? |
| **statické / dynamické** | mení sa prostredie, kým agent rozmýšľa? **Semi-dynamické**: prostredie nie, ale miera úžitku áno (šachové hodiny) |
| **diskrétne / spojité** | konečná množina stavov a akcií, alebo spojité veličiny? |
| **známe / neznáme** | pozná agent zákony prostredia (prechodový model)? Nie je to to isté ako pozorovateľnosť. |

| Úloha | Pozorovateľnosť | Determinizmus | Diskrétnosť | Agenti |
|---|---|---|---|---|
| krížovka | úplná | deterministické | diskrétne | jeden |
| šach s hodinami | úplná | deterministické | diskrétne | viac |
| poker | čiastočná | stochastické | diskrétne | viac |
| Pacman | úplná | deterministické | diskrétne | viac |
| autonómne taxi | čiastočná | stochastické | spojité | viac |
| diagnostika pacienta | čiastočná | stochastické | spojité | jeden |

Najťažší prípad (čiastočne pozorovateľné, stochastické, sekvenčné, dynamické, spojité, neznáme) je autonómna jazda. Algoritmy tejto témy predpokladajú opak: úplne pozorovateľné, deterministické, statické, diskrétne a známe prostredie.

## Formulácia problému

Vyhľadávací problém je určený piatimi vecami:

1. **Počiatočný stav** (initial state).
2. **Akcie** použiteľné v danom stave.
3. **Prechodový model** (funkcia nasledovníkov): stav + akcia → nový stav.
4. **Test cieľa** (goal test): je stav cieľový?
5. **Cena cesty** (path cost): súčet cien krokov `c(n, a, n')`.

Stavy a akcie spolu tvoria **stavový priestor** (graf: uzly = stavy, hrany = akcie). Prednáška 2026 ho uvádza ako **šiestu zložku** (S = množina všetkých stavov, zadaná implicitne). **Riešenie** je postupnosť akcií z počiatočného stavu do cieľového; **optimálne riešenie** má najnižšiu cenu cesty. Heuristika do formulácie problému nepatrí – je to dodatočná znalosť pre informované algoritmy.

### Abstrakcia: svet vs. stavový priestor

- **Svet (world state)** obsahuje všetky detaily prostredia (farba auta, počasie, rádio).
- **Stavový priestor (state space)** obsahuje len atribúty **nevyhnutné pre dané hľadanie**. Menší priestor = rýchlejšie riešenie, ale riziko, že sme zahodili niečo podstatné.
- Príklad Rumunsko: cieľ „byť zajtra v Bukurešti“, stavy = mestá, akcie = prejazdy; palivo ani počasie do stavu nepatria.

Pacman – to isté bludisko, tri úlohy (prednáška 2026: 36 políčok, 30 guľôčok, 2 duchovia s 12 možnými pozíciami):

| Úloha | Čo tvorí stav | Počet stavov |
|---|---|---|
| smerovanie na políčko (pathing) | poloha Pacmana | 36 |
| zjedz všetky guľôčky | poloha + bitový vektor potravy (cieľ: všetky bity false) | 36 · 2^30 |
| plná hra s duchmi | poloha + potrava + polohy duchov | 36 · 2^30 · 12^2 |

Každá premenná navyše počet stavov **násobí**, nie sčítava. V staršej verzii (2020) je v bludisku 120 políčok → 120, 120 · 2^30, 120 · 2^30 · 12^2.

Klasické vyhľadávanie predpokladá prostredie plne pozorovateľné, deterministické, diskrétne, statické a známe – preto je riešením pevná postupnosť akcií.

### 8-puzzle (Loydova osmička) z cvičenia

| Prvok | 8-puzzle |
|---|---|
| Stav | rozloženie dlaždíc 1–8 a prázdneho políčka (`0`) na doske 3×3 – `board` |
| Počiatočný stav | doska, ktorú si naklikáš v GUI |
| Akcie | posun dlaždice susediacej s medzerou do medzery – `get_possible_moves()` vráti 2 (roh), 3 (hrana) alebo 4 (stred) dlaždice |
| Prechodový model | `move_tile(tile)` – vráti **nový** stav |
| Test cieľa | `is_goal()` – doska `1 2 3 / 4 5 6 / 7 8 _` |
| Cena kroku | 1 za každý ťah → cena cesty = počet ťahov |

Fakty (overené prehľadaním celého priestoru kódom z cvičenia): všetkých rozložení dosky je **9! = 362 880** (na prvé políčko 9 možností, na druhé 8 …) – toto číslo uvádza prednáška ako počet stavov a podľa nej sa na to pýta. Z jedného štartu je však dosiahnuteľných iba 9!/2 = **181 440** (druhá polovica rozložení je neriešiteľná), priemerný faktor vetvenia ≈ 2,67, najťažšie stavy potrebujú **31** ťahov, priemer je asi 22.

### Stavový priestor vs. vyhľadávací strom

- **Stavový priestor (graf)** – každý stav je v ňom raz.
- **Vyhľadávací strom** – vzniká počas hľadania; koreň = počiatočný stav, uzol = *cesta* do nejakého stavu. Ten istý stav sa v strome môže objaviť veľakrát (v osmičke stačí ťah tam a späť).

> Na teste (povedané na prednáške 2026 ako častá otázka): **v grafe stavov je každý stav práve raz**, v strome hľadania môže byť mnohokrát. **Uzol stromu nie je vrchol grafu** – uzol je celá cesta z koreňa (postupnosť stav, akcia, nový stav), vrchol je jeden stav. Uzlov, ktoré končia v cieli G, môže byť veľa, vrchol G je v grafe jediný.
- **Uzol** (node) je dátová štruktúra: **stav**, odkaz na **rodiča**, **akcia**, ktorá doň viedla, **cena cesty** `g` a **hĺbka** (prednáška 2020, AIMA). Po rodičoch sa na konci poskladá riešenie – v cvičení `PuzzleState` s `parent` a `moved_tile`.
- **Hranica** (frontier, fringe, open list) – vygenerované, ale ešte neexpandované uzly. **Expandovať** uzol = vygenerovať jeho nasledovníkov.
- Označenie: **b** = faktor vetvenia, **d** = hĺbka najplytšieho riešenia, **m** = maximálna hĺbka stromu (môže byť ∞), **`C*`** = cena optimálneho riešenia, **ε** = najmenšia cena kroku.

## Všeobecná schéma a tree search vs. graph search

Všetky algoritmy z tejto témy sú ten istý cyklus – líšia sa **iba tým, ktorý uzol vyberú z hranice**:

```python
frontier = [start]
while frontier:
    node = frontier.vyber()        # <- tu je celý rozdiel medzi algoritmami
    if node.is_goal():
        return node
    frontier.pridaj(nasledovnici(node))
```

| Vlastnosť | Tree search (vyhľadávanie v strome) | Graph search (vyhľadávanie v grafe) |
|---|---|---|
| Pamätá si navštívené stavy? | nie | áno – množina `visited` / `closed_list` |
| Opakované stavy | expanduje ich znova → pri cykloch sa môže **zacykliť** | každý stav expanduje najviac raz |
| Pamäť | menšia (iba hranica) | väčšia (hranica + navštívené) |
| V kóde z cvičenia | – | `visited` (BFS, DFS), `closed_list` (Greedy, `A*`) |

Dôsledky pre vlastnosti (často sa na to pýtajú):

- **DFS + tree search**: **nie je úplné ani optimálne** – môže donekonečna chodiť v cykle alebo po nekonečnej vetve.
- **DFS + graph search**: v *konečnom* priestore úplné (každý stav raz), stále neoptimálne.
- **BFS + tree search**: úplné a (pri rovnakých cenách krokov) optimálne – nájde najplytšie riešenie, opakované stavy ho len spomaľujú. V starších testoch: „nájde optimálne riešenie v konečných stavových priestoroch“.
- **`A*` + tree search**: optimálne, ak je heuristika **prípustná**. **`A*` + graph search**: optimálne, ak je heuristika **konzistentná**.

GRAPH-SEARCH z prednášky (jediná zmena oproti TREE-SEARCH je množina `explored`):

```text
function GRAPH-SEARCH(problem):
    frontier ← {uzol s počiatočným stavom};  explored ← ∅
    loop:
        if frontier je prázdny: return zlyhanie
        node ← vyber uzol z frontier         (podľa stratégie)
        if node.state je cieľ: return riešenie
        pridaj node.state do explored
        expanduj node; potomka pridaj do frontier,
            iba ak jeho stav nie je v explored ani vo frontier
```

- **Dva zdroje redundancie**: cykly (návrat do už navštíveného stavu) a viacero rôznych ciest do toho istého stavu. V mriežke s hĺbkou 20 je rádovo 10^9 ciest, ale len niekoľko stoviek stavov – vyhľadávací strom je o šesť rádov väčší než graf stavov.
- „Graf stavov má úloha, strom hľadania má beh algoritmu.“ V konečnom priestore sa takmer vždy použije GRAPH-SEARCH; TREE-SEARCH tam, kde sa stavy nedajú evidovať.

## Ako sa algoritmy hodnotia

| Kritérium | Otázka |
|---|---|
| **Úplnosť** (completeness) | Nájde riešenie vždy, keď nejaké existuje? |
| **Optimálnosť** (optimality) | Je nájdené riešenie to s najnižšou cenou cesty? |
| **Časová zložitosť** | Koľko uzlov vygeneruje / expanduje? |
| **Pamäťová zložitosť** | Koľko uzlov musí držať naraz v pamäti? |

V cvičení tomu zodpovedajú čísla z GUI: `expanded` (čas), `discovered` (pamäť pri graph search) a `Path length` (kvalita riešenia).

Prečo je exponenciálna zložitosť `b^d` problém (slajd 2026, jedna operácia = 1 µs): `2^n` pri n = 20 trvá 1 s, pri n = 40 už 12,7 dňa a pri n = 60 asi 36 500 rokov. Preto sa stavový priestor zmenšuje abstrakciou a hľadajú sa algoritmy, ktoré expandujú čo najmenej uzlov.

## Neinformované (slepé) vyhľadávanie

Neinformované algoritmy poznajú iba formuláciu problému – **nepoužívajú heuristiku**, nevedia, ktorý stav je „bližšie“ k cieľu. Patria sem BFS, DFS, UCS, depth-limited, iterative deepening a obojsmerné vyhľadávanie.

### BFS – prehľadávanie do šírky

- Expanduje **najplytší** uzol; hranica je **FIFO front** (`deque`, `popleft()`).
- Prehľadáva **po úrovniach**: najprv všetky uzly v hĺbke 0, potom 1, 2, … – ďalšiu úroveň začne až po expandovaní celej predchádzajúcej.
- **Úplné** (pri konečnom b). **Optimálne iba pri rovnakých cenách krokov** (nájde riešenie s najmenším *počtom* krokov); pri rôznych cenách hrán optimálne nie je.
- Čas `O(b^d)`, pamäť `O(b^d)` – **pamäť je hlavný problém** (drží celú úroveň).
- Niekde sa uvádza `O(b^(d+1))`: to platí, keď sa cieľ testuje až **pri výbere** uzla z frontu. BFS vtedy stihne vygenerovať aj celú úroveň d + 1, kým cieľ v hĺbke d vyberie. Pri teste už pri vygenerovaní je to `O(b^d)`.

### DFS – prehľadávanie do hĺbky

- Expanduje **najhlbší** uzol; hranica je **LIFO zásobník** (`list`, `pop()`) alebo rekurzia.
- **Nie je optimálne** – vráti prvé riešenie, na ktoré narazí (v osmičke bežne desaťtisíce ťahov).
- **Úplnosť**: tree search nie (zacyklí sa v grafe s cyklami, stratí sa v nekonečnej vetve); graph search v konečnom priestore áno.
- Čas `O(b^m)`, pamäť **`O(b·m)`** – lineárna, **výrazne menej ako BFS**. To je jeho hlavná výhoda.
- Rekurzívna verzia používa zásobník volaní, iteratívna explicitný zásobník – robia to isté. Rekurzia však v Pythone pri veľkej hĺbke spadne na limite rekurzie, preto sa na cvičeniach oplatí iteratívna verzia.

**Kedy BFS a kedy DFS** (slajd 2026): BFS, keď záleží na **počte krokov** alebo je riešenie **plytké** (smerovanie a broadcast – najmenej preskokov, vzdialenosť v sociálnej sieti, web crawler). DFS, keď **stačí ľubovoľné riešenie**, strom je hlboký a pamäť vzácna (prechod adresárového stromu, grafy závislostí, backtracking pri CSP – Sudoku, N dám, farbenie grafu). Obe sa líšia jediným riadkom: či sa z hranice berie prvý, alebo posledný vložený uzol.

### Depth-limited search (DFS s limitom hĺbky)

- DFS, ktoré neexpanduje uzly hlbšie než limit `l` → nezablúdi v nekonečnej vetve.
- Ak je `l < d`, riešenie nenájde (neúplné); ak `l > d`, nemusí byť optimálne. Čas `O(b^l)`, pamäť `O(b·l)`.
- **Dva druhy zlyhania**: „riešenie neexistuje“ (failure) vs. „limit dosiahnutý“ (**cutoff**). Cutoff znamená: skús väčší limit – presne to robí iteratívne prehlbovanie.
- Limit `l` ráta **počet akcií**, nie ich cenu (orezávanie podľa ceny je až pri `A*`).

> Pozor: parameter `limit=50_000` v `dfs` z cvičenia **nie je limit hĺbky**, ale limit počtu **expandovaných** stavov – poistka, aby DFS neprehľadávalo celý priestor.

### Iterative deepening (iteratívne prehlbovanie, IDS)

- Opakovane spúšťa depth-limited search s limitom 0, 1, 2, 3, … – **iteratívne zvyšuje hĺbku** vyhľadávacieho stromu, až kým nenájde cieľ.
- Spája výhody oboch: **pamäť ako DFS** `O(b·d)` a **úplnosť a optimálnosť ako BFS** (pri rovnakých cenách krokov).
- Čas `O(b^d)` – horné úrovne sa generujú opakovane, ale väčšina uzlov je aj tak v poslednej úrovni, takže to veľa nestojí.
- Réžia oproti BFS podľa prednášky: b = 2 → **+84 %**, b = 3 → +48 %, b = 10 → **+11 %**, b = 100 → +1 %. Čím väčší faktor vetvenia, tým lacnejšie je opakovanie.
- Pri b = 10, d = 5 vygeneruje BFS **111 110** uzlov a IDS **123 456** – o 11 % viac času za pamäť menšiu o štyri rády. IDS sa volí, keď je priestor veľký a hĺbka riešenia neznáma.
- Heuristiku **nepoužíva** a BFS s DFS „nestrieda“ – je to stále DFS, len s rastúcim limitom.

### UCS – Uniform-Cost Search (vyhľadávanie s rovnomernou cenou)

- Expanduje uzol s **najnižšou kumulatívnou cenou cesty od štartu `g(n)`** – bez ohľadu na jeho hĺbku. Hranica je **prioritný front podľa `g(n)`** (`heapq`).
- Uzly teda expanduje **v poradí rastúcej ceny**. Je to Dijkstrov algoritmus – smerovacie protokoly OSPF a IS-IS počítajú najkratšie cesty práve ním.
- **Úplné a optimálne** aj pri **rôznych cenách hrán** (ak je každá cena ≥ ε > 0). Čas aj pamäť `O(b^(1 + ⌊C*/ε⌋))`.
- Test cieľa sa robí **pri výbere** uzla z frontu, nie pri jeho vygenerovaní (lacnejšia cesta sa ešte môže objaviť).
- „Uniform“ neznamená, že kroky majú rovnakú cenu. Ak ju **majú**, UCS sa správa ako BFS.
- Je **slepé** (bez heuristiky): UCS = `A*` s `h(n) = 0`.
- Ceny krokov musia byť **kladné**. So zápornými cenami UCS nefunguje; tie rieši napr. Bellman-Fordov algoritmus, ktorý v predmete nie je.
- **Kontúry**: UCS sa rozširuje ako kruhová vlna od štartu – najprv všetky uzly s `g ≤ 2`, potom `g ≤ 5`, `g ≤ 8` … – **rovnako do všetkých smerov**, aj od cieľa. O polohe cieľa nič nevie; to rieši až heuristika (Greedy, `A*`).
- Exponent `1 + ⌊C*/ε⌋` môže byť oveľa väčší než d (slajd 2026): ceny všetky 1 → `d + 1` (ako BFS); ceny 1 a 10, cieľ za 10 → exponent **11**, hoci d = 1; ceny 0,1 a 10 → exponent **101**. Pri mnohých lacných hranách teda UCS expanduje **viac** uzlov než BFS či DFS. Úzkym miestom je pamäť – prioritný front drží celú kontúru s cenou blízkou `C*`.
- **Dôkaz optimality sporom**: nech by UCS vrátil neoptimálny cieľ B, `g(B) > C*`. Na hranici je vždy nejaký uzol n na optimálnej ceste ku G a platí `g(n) ≤ C* < g(B)`. Uzol n (a postupne každý ďalší na optimálnej ceste, až po G) sa teda vyberie **skôr** než B – spor. Platí iba pri kladných cenách.

### Obojsmerné vyhľadávanie (bidirectional search)

- Spustí **dve hľadania naraz**: dopredu od počiatočného stavu a dozadu od cieľového; končí, keď sa hranice **stretnú**.
- Prečo: `b^(d/2) + b^(d/2)` je oveľa menej než `b^d` → býva **výrazne rýchlejšie** než jednosmerné hľadanie, najmä keď je stavový priestor obrovský / riešenie **hlboko**.
- Podmienky podľa prednášky: (1) **cieľový stav**, nie len cieľový test – spätné hľadanie potrebuje koreň; (2) **funkcia predchodcov** (inverzia prechodového modelu – nie vždy ju máme); (3) **jednoznačne porovnateľné stavy** (pri spojitých stavoch sa dva smery „netrafia“); (4) **test stretnutia** po každom vygenerovaní uzla.
- Príklad: b = 10, d = 6 → BFS expanduje **1 111 110** uzlov, obojsmerné hľadanie (dva stromy do hĺbky 3) **2 220**.
- Pamäť `O(b^(d/2))` – aspoň jednu hranicu treba držať celú, aby sa dal zistiť prienik. Úspora pamäte teda **nie je** jeho typická vlastnosť (DFS či IDS majú lineárnu).
- Najkratšiu cestu **negarantuje vždy** – iba ak sú obe hľadania BFS a ceny krokov rovnaké (a správne sa ošetrí stretnutie).

## Informované (heuristické) vyhľadávanie

**Heuristika `h(n)`** = odhad ceny najlacnejšej cesty zo stavu `n` do cieľa. `h(cieľ) = 0`. Informované algoritmy ju používajú na výber uzla z hranice; z algoritmov tejto témy sú to iba **Greedy** a **`A*`**.

| Funkcia | Význam |
|---|---|
| `g(n)` | skutočná cena cesty **zo štartu do n** (to, čo sme už „zaplatili“) |
| `h(n)` | **odhad** ceny z n do cieľa |
| `h*(n)` | skutočná cena optimálnej cesty z n do cieľa (nepoznáme ju) |
| `f(n) = g(n) + h(n)` | odhad ceny celej cesty zo štartu do cieľa vedúcej cez n |

### Greedy best-first search (pažravé / hladové vyhľadávanie)

- Expanduje uzol, ktorý **vyzerá najbližšie k cieľu**: priorita = **`h(n)`**.
- **Ignoruje `g(n)`** – skutočné ceny zo štartu do aktuálneho stavu sa zanedbávajú.
- V každom kroku robí **lokálne najlepšie** rozhodnutie → väčšinou je **rýchle** (rýchlejšie než UCS, expanduje málo uzlov), ale **nie je optimálne** – ani s prípustnou, ani s konzistentnou heuristikou.
- Úplnosť: tree search nie (môže sa zacykliť), graph search v konečnom priestore áno. Najhorší prípad času aj pamäte `O(b^m)`.
- Z algoritmov BFS / DFS / UCS / Greedy / `A*` je „greedy“ iba tento – `A*` ani UCS pažravé nie sú.
- Príklady heuristík z prednášky: Rumunsko – **vzdušná vzdialenosť** mesta do Bukurešti; palacinky – **najväčšia palacinka, ktorá nie je na správnom mieste**; Pacman – Manhattan. Pacman nechodí šikmo, preto je Manhattan (súčet rozdielov x a y) lepšia voľba než euklidovská vzdialenosť: obe sú prípustné, ale Manhattan je väčšia, a teda informovanejšia.
- Klasický príklad (AIMA, demo z prednášky 2020): greedy z Aradu do Bukurešti ide **Arad → Sibiu → Fagaras → Bukurešť (450 km)**, lebo Fagaras „vyzerá“ bližšie. Optimálna cesta vedie cez **Rimnicu Vilcea a Pitesti (418 km)** – tú nájde `A*`.
- Pri zle zvolenej heuristike sa greedy môže zvrhnúť až na „**zle expandované DFS**“ – ide hlboko nesprávnou vetvou.

### A* search

- Expanduje uzol s najnižšou hodnotou kriteriálnej funkcie **`f(n) = g(n) + h(n)`**. Spája UCS (`g`) a Greedy (`h`).
- **Optimálne**, ak je `h` **prípustná** (tree search), resp. **konzistentná** (graph search). **Úplné** (pri cenách krokov ≥ ε > 0).
- Heuristika, ktorá **nadhodnocuje**, optimálnosť kazí – `A*` môže dobrú cestu „odpísať“.
- Test cieľa sa robí **pri výbere** uzla z open listu (ako pri UCS).
- Čas: v najhoršom prípade exponenciálny, závisí od kvality `h`. **Pamäť je hlavný problém** – drží všetky vygenerované uzly.
- Špeciálne prípady: `h(n) = 0` → **UCS**; vynechané `g(n)` → **Greedy**; pri rovnakých cenách krokov a `h = 0` sa správa ako **BFS**.
- Použitie (prednáška): hry (Starcraft), smerovacie protokoly, pohyb robota, spracovanie reči, navigácie.

**Dôkaz optimality `A*`** (tree search, prípustná `h`). Nech G je optimálny cieľ, B suboptimálny cieľ a B je už vo fronte. Vo fronte je aj nejaký predchodca `n` cieľa G. Potom:

1. `f(n) ≤ f(G)`, lebo `h` je prípustná (`f(n) = g(n) + h(n)` nenadhodnocuje cenu cesty cez `n` do G a `h(G) = 0`),
2. `f(G) < f(B)`, lebo B je suboptimálny (`g(G) < g(B)`, `h = 0` v oboch cieľoch),
3. teda `f(n) ≤ f(G) < f(B)` → `n` sa expanduje pred B; to platí pre všetkých predchodcov G,
4. G sa vyberie z frontu skôr než B.

**UCS vs. `A*`**: UCS expanduje všetky uzly s `g(n) ≤ C*` (rovnomerne „do všetkých smerov“), `A*` iba uzly s `f(n) = g(n) + h(n) ≤ C*` – s prípustnou heuristikou teda expanduje **menej** uzlov a smeruje k cieľu.

### Heuristické algoritmy všeobecne

Heuristický algoritmus obetuje záruku optimálnosti za rýchlosť: nájde (dosť dobré) riešenie **rýchlejšie než presné / analytické metódy** typu UCS, ale **nie nutne optimálne**. Ich pamäťová náročnosť nie je „vždy väčšia“ než pri BFS alebo DFS.

> Na teste: v starších otázkach sa heuristické algoritmy charakterizujú ako „rýchlejšie v porovnaní s analytickými riešeniami“ a „kompletné, no nie optimálne“. Výnimkou z „nie optimálne“ je `A*` s prípustnou heuristikou.

> Na teste: BFS, DFS, UCS, Greedy a `A*` hľadajú **cestu** v grafe (riešením je postupnosť akcií). Hill climbing, simulované žíhanie a genetické algoritmy sú **lokálne vyhľadávanie** – hodia sa na identifikačné problémy (zaujíma nás len cieľový stav), nie na hľadanie cesty (téma 8).

## Heuristiky

### Prípustná (admissible) heuristika

`h(n) ≤ h*(n)` pre každý stav n – **nikdy nenadhodnocuje** skutočnú cenu do cieľa (je „optimistická“).

- Nemusí byť presná; presný odhad `h = h*` je len krajný prípad. Aj `h(n) = 0` je prípustná.
- Zaručuje optimálnosť `A*` pri **vyhľadávaní v strome**.
- Prípustnosť je definovaná cez `h ≤ h*` – nie tým, že heuristika „vyberie najkratšiu cestu“, ani tým, že „berie do úvahy ceny od štartu“. Konzistencia nie je jej definíciou, ale silnejšou vlastnosťou (pozri nižšie).
- Prednáška: **pesimistická** heuristika (`h > h*`, nadhodnocuje) môže nechať dobrý plán vo fronte a vybrať horší; **optimistická** (prípustná) nikdy nepresahuje skutočné náklady. Neprípustné heuristiky sa v praxi tiež používajú – sú rýchlejšie, ale strácajú záruku optimálnosti.

### Konzistentná (monotónna) heuristika

`h(n) ≤ c(n, n') + h(n')` pre každého nasledovníka n' stavu n (trojuholníková nerovnosť), a `h(cieľ) = 0`. Slovami: heuristika stavu je najviac heuristika potomka plus cena kroku k nemu.

- **Konzistentná ⇒ prípustná** (naopak to neplatí). Pre konzistentnú heuristiku teda platí aj `h(n) ≤ h*(n)`.
- Hodnota `f(n)` pozdĺž každej cesty **neklesá** (je neklesajúca) – nie „klesá“.
- Zaručuje optimálnosť `A*` pri **vyhľadávaní v grafe**: keď `A*` stav expanduje, už k nemu našiel najlacnejšiu cestu.
- Krátke dôkazy (prednáška ich uvádza ako typickú otázku):
  - *f neklesá*: pre potomka n' platí `f(n') = g(n) + c(n, n') + h(n') ≥ g(n) + h(n) = f(n)` – stačí dosadiť konzistenciu.
  - *konzistentná ⇒ prípustná*: na optimálnej ceste n → n1 → … → G opakovane použi konzistenciu: `h(n) ≤ c(n, n1) + h(n1) ≤ … ≤ súčet cien + h(G) = h*(n)`, lebo `h(G) = 0`.
- Heuristiky odvodené z **relaxovaného problému** bývajú konzistentné: misplaced tiles aj Manhattan pri osmičke, vzdušná vzdialenosť v Rumunsku. Aj `h = 0` je konzistentná – preto je UCS optimálny aj pri graph search.

### Heuristiky pre 8-puzzle (`core/state.py`)

| Heuristika | `count_misplaced_tiles()` – h1 | `manhattan_distance()` – h2 |
|---|---|---|
| Čo počíta | počet dlaždíc, ktoré nie sú na svojom mieste | súčet vzdialeností (riadky + stĺpce) každej dlaždice od jej cieľového políčka |
| Medzera (`0`) | **nepočíta sa** | **nepočíta sa** |
| Prečo je prípustná | každú zle uloženú dlaždicu treba pohnúť aspoň raz | jeden ťah posunie jednu dlaždicu o jedno políčko |
| Prípustná / konzistentná | áno / áno | áno / áno |

- Cieľové políčko dlaždice `val`: riadok `(val - 1) // size`, stĺpec `(val - 1) % size`.
- **Dominancia**: `h2(n) ≥ h1(n)` pre každý stav → Manhattan je **informovanejšia** a `A*` s ňou expanduje menej uzlov (stav na 14 ťahov: 77 expandovaných s h2 oproti 302 s h1; BFS 5 961).
- `max(h1, h2)` je prípustná. **Nie sú prípustné**: `h1 + h2`, `2 · h2`, ani verzie, ktoré započítajú aj medzeru – na doske `1 2 3 / 4 5 _ / 7 8 6` (1 ťah od cieľa) dajú 2.
- Prípustné heuristiky vznikajú z **relaxovaného problému** (uvoľnené pravidlá): h1 = dlaždicu možno preložiť kamkoľvek, h2 = dlaždica sa smie posunúť aj na obsadené políčko.
  - Pôvodné pravidlo: dlaždica sa môže pohnúť z A do B, ak A **susedí** s B (horizontálne alebo vertikálne) **a** B je prázdne.
  - Relaxácia 1: z A do B, ak A susedí s B → **Manhattan**. Relaxácia 2: z A do B vždy → **misplaced tiles**.
  - Optimálna cena relaxovaného problému je prípustná heuristika pôvodného (relaxovaný problém má viac hrán – je to „supergraf“).
- Dominancia má cenu: heuristika bližšie k `h*` expanduje menej stavov, ale jej výpočet býva drahší.

Počet expandovaných uzlov na osmičke podľa dĺžky optimálneho riešenia (prednáška, CS188):

| Riešenie | UCS | `A*` + misplaced tiles | `A*` + Manhattan |
|---|---|---|---|
| 4 kroky | 112 | 13 | 12 |
| 8 krokov | 6 300 | 39 | 25 |
| 12 krokov | 3,6 · 10^6 | 227 | 73 |

## Porovnanie algoritmov

> Na teste (prednáška 2026): pri BFS, UCS, DFS, depth-limited, iteratívnom prehlbovaní a obojsmernom hľadaní treba vedieť výhody a nevýhody – **úplnosť, optimálnosť, časovú a pamäťovú zložitosť**. Prednášajúci to zdôraznil: **DFS nie je optimálne** ani podmienečne.

| Algoritmus | Hranica (dátová štruktúra) | Úplný? | Optimálny? | Čas | Pamäť |
|---|---|---|---|---|---|
| **BFS** | FIFO front (`deque`) | áno (konečné b) | áno, ak sú ceny krokov rovnaké | `O(b^d)` | `O(b^d)` |
| **DFS** | LIFO zásobník (`list`) | nie (tree search); áno v konečnom priestore s `visited` | nie | `O(b^m)` | `O(b·m)` |
| **Depth-limited** | zásobník + limit hĺbky l | nie, ak l < d | nie | `O(b^l)` | `O(b·l)` |
| **Iterative deepening** | zásobník, limit 0, 1, 2, … | áno | áno, ak sú ceny krokov rovnaké | `O(b^d)` | `O(b·d)` |
| **UCS** | prioritný front podľa `g(n)` | áno (ceny ≥ ε > 0) | áno | `O(b^(1+⌊C*/ε⌋))` | `O(b^(1+⌊C*/ε⌋))` |
| **Bidirectional** | dve hranice (od štartu a od cieľa) | áno (s BFS) | áno (BFS z oboch strán, rovnaké ceny) | `O(b^(d/2))` | `O(b^(d/2))` |
| **Greedy** | prioritný front podľa `h(n)` | nie (tree search); áno v konečnom priestore s closed listom | nie | `O(b^m)` | `O(b^m)` |
| **`A*`** | prioritný front podľa `f(n) = g(n) + h(n)` | áno | áno, ak je h prípustná (strom) / konzistentná (graf) | exponenciálny, závisí od h | exponenciálna – všetky uzly v pamäti |

## Mini-trace na malom grafe

Orientovaný graf, štart **S**, cieľ **G**. Nasledovníci sa generujú v uvedenom poradí:

| Uzol | Nasledovníci (cena hrany) | h(n) |
|---|---|---|
| S | A (1), B (4), D (2) | 5 |
| A | B (2), C (5) | 4 |
| B | C (1), G (6) | 2 |
| C | G (3) | 3 |
| D | G (9) | 6 |
| G | – | 0 |

Heuristika je prípustná aj konzistentná (`h*`: S 7, A 6, B 4, C 3, D 9). Všetky algoritmy testujú cieľ **pri výbere** uzla z hranice; BFS a DFS označujú uzol za navštívený už **pri vložení** do hranice (ako v kóde z cvičenia).

| Algoritmus | Poradie expanzie | Nájdená cesta | Cena |
|---|---|---|---|
| BFS | S, A, B, D, C, G | S → B → G | 10 |
| DFS (zásobník, `pop()` z konca) | S, D, G | S → D → G | 11 |
| UCS | S, A, D, B, C, G | S → A → B → C → G | **7** |
| Greedy | S, B, G | S → B → G | 10 |
| `A*` | S, A, B, C, G | S → A → B → C → G | **7** |

- **BFS** nájde cestu s najmenším počtom hrán (2), nie najlacnejšiu. G objaví cez B, lebo B expanduje skôr než D.
- **DFS** vyberá z konca zásobníka → po S ide posledný vložený D, potom G.
- **Greedy** sa dá zlákať nízkym `h(B) = 2` a priamou hranou do G – cenu hrán (4 + 6) nevidí.
- **UCS** nájde optimum, ale expanduje aj D (g = 2). **`A*`** uzol D (f = 2 + 6 = 8 > 7) **vôbec neexpanduje**.

`A*` krok po kroku (open list ako `uzol(g, f)`):

| Krok | Expandujem | Čo sa stane | Open list po kroku |
|---|---|---|---|
| 1 | S (g 0, f 5) | A: g 1, f 5 · B: g 4, f 6 · D: g 2, f 8 | A(1, 5), B(4, 6), D(2, 8) |
| 2 | A (f 5) | B cez A: 1 + 2 = 3 < 4 → **zlepšenie**, f 5 · C: g 6, f 9 | B(3, 5), D(2, 8), C(6, 9) |
| 3 | B (f 5) | C cez B: 3 + 1 = 4 < 6 → zlepšenie, f 7 · G: g 9, f 9 | C(4, 7), D(2, 8), G(9, 9) |
| 4 | C (f 7) | G cez C: 4 + 3 = 7 < 9 → zlepšenie, f 7 | G(7, 7), D(2, 8) |
| 5 | G (f 7) | cieľ → koniec | – |

V kroku 3 bol G už v open liste s g = 9. Keby sa cieľ testoval pri vygenerovaní, `A*` by vrátil cestu za 9 – preto sa testuje až pri výbere.

### Mini-trace na osmičke

Štart `1 2 3 / 4 _ 6 / 7 5 8` (riešenie: ťahy 5, 8). `get_possible_moves()` vráti `[2, 5, 4, 6]` (hore, dole, vľavo, vpravo od medzery). Manhattan štartu je 2.

| Ťah | Nový stav | h (Manhattan) | g | f = g + h |
|---|---|---|---|---|
| 2 | `1 _ 3 / 4 2 6 / 7 5 8` | 3 | 1 | 4 |
| **5** | `1 2 3 / 4 5 6 / 7 _ 8` | **1** | 1 | **2** |
| 4 | `1 2 3 / _ 4 6 / 7 5 8` | 3 | 1 | 4 |
| 6 | `1 2 3 / 4 6 _ / 7 5 8` | 3 | 1 | 4 |

`A*` aj Greedy expandujú stav po ťahu 5; z neho ťah 8 dá cieľ (g 2, h 0, f 2), ktorý sa vyberie ako ďalší. Výsledok: cesta `[5, 8]`, `discovered = 7`, `expanded = 3`. BFS na tom istom stave: `discovered = 16`, `expanded = 9`.

### Príklady zo starších skúšok

**Prípustná, ale nekonzistentná heuristika.** Hrany: S→A (1), S→B (1), A→C (1), B→C (2), C→G (3). Heuristika: h(S) = 2, h(A) = 4, h(B) = 1, h(C) = 1, h(G) = 0.

- Optimum je S → A → C → G s cenou **5** (S → B → C → G stojí 6).
- `h` je **prípustná** (h*(A) = 4, h*(B) = 5, h*(C) = 3, h*(S) = 5), ale **nie konzistentná**: h(A) = 4 > c(A, C) + h(C) = 1 + 1 = 2.
- `A*` **graph search**: expanduje S, potom B (f = 1 + 1 = 2), potom C cez B (g = 3, f = 4) a C zaradí do `explored`. Až potom príde A (f = 5); lacnejšiu cestu do C (g = 2) už zahodí, lebo C je preskúmaný. Vráti **S → B → C → G (6)** – neoptimálne.
- `A*` **tree search** s tou istou `h` by C expandoval znova a vrátil optimum 5. Preto: graph search potrebuje konzistentnú heuristiku.

**Trace UCS / Greedy / `A*`** (graf z CS188). Hrany: S→a (1), a→b (1), b→c (1), a→d (3), a→e (8), e→d (1), d→G (2). Heuristika: S 6, a 5, b 6, c 7, d 2, e 1, G 0.

| Algoritmus | Poradie expanzie | Cesta | Cena |
|---|---|---|---|
| UCS | S, a, b, c, d, G | S → a → d → G | 6 |
| Greedy (graph search) | S, a, **e**, d, G | S → a → d → G | 6 |
| `A*` | S, a, d, G | S → a → d → G | 6 |

- Greedy po `a` vyberie `e`, lebo má najnižšie h = 1, hoci hrana a→e stojí 8. UCS ani `A*` uzol `e` vôbec neexpandujú. Cestu cez e (cena 12) Greedy nevráti len preto, že d už bolo vo fronte z `a` – optimum tu našiel náhodou.
- `A*`: po expanzii `a` sú vo fronte b (f = 2 + 6 = 8), d (f = 4 + 2 = 6), e (f = 9 + 1 = 10) → vyberie d, potom G (f = 6).
- UCS expanduje aj slepú vetvu b, c (g = 2, 3 < 4), lebo nevidí heuristiku.

## Kód z cvičenia: čo vedieť napísať

`PuzzleState` (`core/state.py`):

| Člen | Čo robí |
|---|---|
| `board`, `size`, `parent`, `moved_tile` | doska (kópia `[row[:] for row in board]`), jej rozmer, odkaz na predchodcu, dlaždica posunutá posledným ťahom |
| `get_possible_moves()` | zoznam **čísel dlaždíc**, ktoré môžu ísť do medzery (poradie: hore, dole, vľavo, vpravo) |
| `move_tile(tile)` | **nový** `PuzzleState` s `parent=self`, `moved_tile=tile`; pôvodný stav nemení |
| `is_goal()` | porovná sploštenú dosku s `[1, 2, …, 8, 0]` |
| `reconstruct_path()` | ide po `parent` až ku koreňu, zbiera `moved_tile`, na konci zoznam **otočí** |
| `__eq__`, `__hash__` | dva stavy s rovnakou doskou sú rovnaké a majú rovnaký hash → dajú sa dať do `set` / `dict` |

Všetky funkcie v `core/algorithms.py` vracajú trojicu **`(goal_state, discovered, expanded)`**, resp. `(None, discovered, expanded)`:

- `discovered` – počet **rôznych** stavov pridaných do hranice / `visited` (štart sa počíta → začína na 1),
- `expanded` – počet stavov **vybratých** z hranice (začína na 0).

Kostra BFS a DFS je rovnaká, líši sa **jediným riadkom**:

```python
current_state = frontier.popleft()   # BFS: zo začiatku frontu (FIFO)
current_state = stack.pop()          # DFS: z konca zásobníka (LIFO)
```

DFS má navyše na začiatku cyklu poistku `if expanded >= limit: return None, discovered, expanded`.

Greedy a `A*` idú podľa pseudokódov (open list = prioritný front, closed list = množina) a v Pythone používajú `heapq`:

```python
heapq.heappush(open_list, (priorita, state_id, stav))
_, _id, current = heapq.heappop(open_list)   # najnižšia priorita
```

| Algoritmus | Priorita vkladaného suseda |
|---|---|
| UCS | `tentative_g` |
| Greedy | `heuristic(neighbor)` |
| `A*` | `tentative_g + heuristic(neighbor)` |

- `state_id` je počítadlo na **rozhodovanie zhôd**: pri rovnakej priorite by Python porovnával stavy a `PuzzleState` nemá `<` → `TypeError`.
- `A*` si drží slovník `g` (cena najlepšej známej cesty do stavu). Sused sa vloží, len ak `tentative_g < g(neighbor)`; `tentative_g = g[current] + 1`, lebo ťah stojí 1.
- „Update priority“ z pseudokódu sa v `heapq` rieši vložením nového záznamu; starý sa po vybratí preskočí (`if current in closed_list: continue`).
- Rodiča (`parent(neighbor) ← current`) nastavuje už `move_tile`.

Čo ukázalo cvičenie (stav `8 1 3 / 4 _ 2 / 7 6 5`, optimum 14 ťahov):

| Algoritmus | Dĺžka cesty | Discovered | Expanded |
|---|---|---|---|
| BFS | 14 | 9 021 | 5 961 |
| DFS (limit 50 000) | nenájde – narazí na limit | 82 489 | 50 000 |
| Greedy (Manhattan) | 36 | 312 | 179 |
| `A*` (Manhattan) | 14 | 128 | 77 |

## Typické chytáky

- BFS je optimálne **len pri rovnakých cenách krokov**; pri rôznych cenách je optimálne UCS.
- DFS má **menšiu pamäť** než BFS, ale nie je optimálne a v strome ani úplné.
- „Uniform“ v UCS = expanduje rovnomerne podľa ceny, **nie** „všetky kroky stoja rovnako“.
- Greedy **nie je optimálny ani s konzistentnou heuristikou**; optimálnosť dáva až `g(n)` v `A*`.
- Nadhodnocujúca heuristika `A*` neprospieva – ruší záruku optimálnosti.
- Konzistentná ⇒ prípustná; s konzistentnou heuristikou `f` pozdĺž cesty **neklesá**.
- Iterative deepening nepoužíva heuristiku a neexpanduje „prioritne najplytší uzol“ – to robí BFS.
- Obojsmerné vyhľadávanie potrebuje **známy cieľový stav**; neslúži na úsporu pamäte a najkratšiu cestu nedáva automaticky.
- Reflexný agent neplánuje a nezohľadňuje budúce dôsledky; racionálny agent maximalizuje **očakávaný úžitok**.
- Racionalita nie je vlastnosť agenta samotného – závisí od miery úžitku, vstavanej znalosti, dostupných akcií a postupnosti vnemov.
- „Známe prostredie“ (poznáme prechodový model) ≠ „plne pozorovateľné“ (senzory vidia celý stav).
- Prípustná, ale nekonzistentná heuristika: `A*` v strome je optimálne, `A*` v grafe (s `explored`) už nemusí byť.

## Rýchle zhrnutie

- Problém = počiatočný stav, akcie, prechodový model, test cieľa, cena cesty; riešenie = postupnosť akcií.
- Algoritmy sa líšia iba výberom uzla z hranice: BFS FIFO, DFS LIFO, UCS `g(n)`, Greedy `h(n)`, `A*` `f(n) = g(n) + h(n)`.
- BFS: po úrovniach, úplné, optimálne pri rovnakých cenách, pamäť `O(b^d)`.
- DFS: do hĺbky, pamäť `O(b·m)`, neoptimálne; v strome sa môže zacykliť → neúplné.
- UCS: najnižšia kumulatívna cena od štartu, optimálne aj pri rôznych cenách, slepé; = `A*` s h = 0.
- Iterative deepening: DFS s limitom 0, 1, 2, … – pamäť DFS, úplnosť a optimálnosť BFS.
- Bidirectional: od štartu aj od cieľa naraz, `2·b^(d/2)` namiesto `b^d`; treba poznať cieľ.
- Greedy: iba `h(n)`, ignoruje `g(n)`, rýchly, neoptimálny.
- `A*`: optimálny s prípustnou heuristikou (strom) / konzistentnou (graf); pamäťovo náročný.
- Prípustná: `h(n) ≤ h*(n)`. Konzistentná: `h(n) ≤ c(n, n') + h(n')`. Konzistentná ⇒ prípustná.
- 8-puzzle: misplaced tiles aj Manhattan sú prípustné, medzera sa nepočíta, Manhattan ≥ misplaced (dominuje).
- Tree search si navštívené stavy nepamätá, graph search áno (`visited` / `closed_list`).
- Kód: `popleft()` ↔ `pop()` mení BFS na DFS; návrat `(goal_state, discovered, expanded)`; `heapq` so záznamom `(priorita, state_id, stav)`.
- Reflexný agent = len aktuálny vnem; racionálny agent = maximalizuje očakávaný úžitok.
- Prostredie má 7 dimenzií, úlohu špecifikuje PEAS; stavový priestor obsahuje len to, čo úloha potrebuje (Pacman 36 → 36 · 2^30 stavov); UCS expanduje `g ≤ C*`, `A*` len `f ≤ C*`.
