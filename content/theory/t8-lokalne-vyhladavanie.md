# Lokálne vyhľadávanie: hill climbing, simulované žíhanie, genetické algoritmy

Podklad: cvičenie z 10. týždňa (N-dám – `core/state.py`, `core/algorithms.py`, na porovnanie `core/search_state.py` a `core/search_algorithms.py`), prednáška J. Gazdu z roku 2020 „CSP 2“ (lokálne hľadanie, local beam, genetické algoritmy; z archívu videí) a štandardné definície z Russell & Norvig (AIMA).

## Systematické vs. lokálne vyhľadávanie

| | Systematické (BFS, DFS, UCS, A*) | Lokálne (hill climbing, SA, GA, min-conflicts) |
|---|---|---|
| Čo si pamätá | frontier (otvorené stavy) + navštívené stavy | **iba aktuálny stav** (GA: populáciu) |
| Pamäť | veľká, rastie s počtom stavov | malá, konštantná |
| Čo je výsledok | **cesta** (postupnosť ťahov) do cieľa | **koncový stav** – cesta je nepodstatná |
| Záruky | úplnosť, pri BFS/UCS/A* s prípustnou `h` aj najkratšia cesta | žiadne – môže uviaznuť v lokálnom optime |
| Kedy použiť | hľadanie cesty v grafe, plánovanie | identifikačné a optimalizačné problémy, obrovské stavové priestory |

Lokálne vyhľadávanie sa pohybuje po **krajine** účelovej (evaluačnej) funkcie – každý stav má hodnotu a cieľom je nájsť stav s najlepšou hodnotou:

| Pojem | Význam |
|---|---|
| globálne maximum (optimum) | najlepší stav v celom priestore |
| **lokálne maximum** | stav lepší než všetci jeho susedia, ale horší než globálne maximum |
| **planina (plateau)** | rovná oblasť – susedné stavy majú (približne) **rovnakú** hodnotu, algoritmus nevie, kam ísť |
| rameno (shoulder) | planina, z ktorej sa ešte dá pokračovať k lepším stavom |
| **hrebeň (ridge)** | postupnosť lokálnych maxím, cez ktorú sa jednotlivými ťahmi ťažko postupuje |

> **Pozor:** v cvičení sa hodnota `h = conflicts()` **minimalizuje**. „Lokálne maximum“ z teórie je tu **lokálne minimum** (`h > 0`, žiaden sused nemá nižšie `h`) – GUI vtedy vypíše „Stuck - local minimum (h > 0)“.

## N-dám ako úloha lokálneho vyhľadávania

- **Stav** = úplné rozmiestnenie, v každom stĺpci práve jedna dáma: `queens[col] = row`. Konflikty v stĺpcoch preto nenastanú.
- **Heuristika** `h = conflicts()` = počet **dvojíc** dám, ktoré sa navzájom ohrozujú (rovnaký riadok alebo diagonála). `h = 0` je riešenie.
- **Sused** = presun **jednej** dámy do iného riadku v jej stĺpci → každý stav má `N · (N − 1)` susedov (N = 8: 56).
- Stavový priestor má `N^N` dosiek (N = 8: 16 777 216).

Test, či sa dámy v stĺpcoch `c1 < c2` ohrozujú: `q[c1] == q[c2] or abs(q[c1] - q[c2]) == c2 - c1`. `NQueensState.conflicts()` počíta to isté cez počty dám na čiarach: `k` dám v jednom riadku alebo na jednej diagonále dáva `k · (k − 1) / 2` dvojíc; diagonála má index `r − c`, antidiagonála `r + c`.

| Doska `queens` (N = 4) | `h` | Poznámka |
|---|---|---|
| `(1, 3, 0, 2)`, `(2, 0, 3, 1)` | 0 | jediné dve riešenia |
| `(0, 1, 2, 3)` | 6 | všetky na jednej diagonále: `4 · 3 / 2` |
| `(0, 0, 0, 0)` | 6 | všetky v jednom riadku |
| `(0, 3, 0, 3)` | 3 | dvojice (0,2) a (1,3) v riadku, (0,3) na diagonále |
| `(1, 3, 0, 3)` | 1 | sused `(1, 3, 0, 2)` má `h = 0` |
| `(0, 3, 1, 2)` | 1 | žiaden sused nie je lepší – hill climbing uviazne |

| Volanie | Význam |
|---|---|
| `state.conflicts()` | `h` – počet ohrozujúcich sa dvojíc (minimalizuje sa) |
| `state.is_goal()` | `conflicts() == 0` |
| `state.neighbors()` | zoznam všetkých `N · (N − 1)` susedov |
| `state.best_neighbor()` | sused s najnižším `h`, zhody sa rozhodnú náhodne |
| `state.random_neighbor()` | jeden náhodný sused |
| `NQueensState.random(n)` | náhodná doska veľkosti `n` |
| `p1.crossover(p2)` | dieťa: začiatok z `p1`, zvyšok z `p2` |
| `child.mutate()` | dieťa s jednou náhodne presunutou dámou |
| `tournament_selection(population, k=3)` | najlepší z `k` náhodne vybraných jedincov |

Každý algoritmus v `core/algorithms.py` vracia dvojicu **`(final_state, history)`**. Pri hill climbingu a žíhaní je `history[0]` štartový stav a pridáva sa doň aktuálny stav; pri GA obsahuje `history` najlepšieho jedinca každej generácie.

## Hill climbing (horolezecký algoritmus)

Cyklus, ktorý sa v každom kroku posúva **v smere zlepšenia** evaluačnej funkcie (v smere jej gradientu – najstrmšieho stúpania): prejde do **najlepšieho suseda** a skončí, keď žiaden sused nie je lepší (*steepest ascent*, pri minimalizácii *steepest descent*).

```python
def hill_climbing(start_state, max_steps=1000):
    current = start_state
    history = [current]
    for _ in range(max_steps):
        if current.is_goal():
            break
        neighbor = current.best_neighbor()
        if neighbor.conflicts() >= current.conflicts():
            break
        current = neighbor
        history.append(current)
    return current, history
```

Vlastnosti:

- jednoduchý a ľahko implementovateľný, pamätá si iba aktuálny stav,
- nepotrebuje poznať celý vyhľadávací priestor – pozerá len na bezprostredných susedov,
- je **pažravý (greedy)**: berie najlepší okamžitý ťah bez pohľadu dopredu,
- **nikdy neprijme horší stav** a nevracia sa (žiadny backtracking),
- rýchlo nájde **lokálne** optimum, ale **nezaručuje globálne** – nie je úplný ani optimálny.

Kde uviazne: **lokálne maximum**, **planina** (v tejto implementácii aj pri rovnako dobrom susedovi – podmienka `>=`), **hrebeň**.

Čísla z AIMA pre 8 dám (zhodujú sa s meraním na kóde z cvičenia): hill climbing vyrieši len **14 %** náhodných dosiek, v 86 % uviazne; je však rýchly – priemerne 4 kroky pri úspechu, 3 pri uviaznutí.

Varianty: *sideways moves* (povoliť obmedzený počet ťahov na rovnako dobrý stav – pomáha na ramene), *stochastic* (náhodný spomedzi lepších susedov), *first-choice* (prvý náhodne vygenerovaný lepší sused), *random restart*.

## Random-restart hill climbing

„Ak neuspeješ, skús znova“: keď hill climbing uviazne, spustí sa odznova z **nového náhodného stavu**, kým sa nenájde riešenie alebo sa nevyčerpá počet reštartov.

```python
def random_restart_hill_climbing(start_state, max_restarts=50):
    result, history = hill_climbing(start_state)
    for _ in range(max_restarts - 1):
        if result.is_goal():
            break
        result, part = hill_climbing(NQueensState.random(start_state.n))
        history.extend(part)
    return result, history
```

- Ak jeden beh uspeje s pravdepodobnosťou `p`, očakávaný počet behov je `1 / p` (8 dám: `p ≈ 0,14` → asi 7 behov).
- Pravdepodobnosť úspechu aspoň v jednom z `k` behov je `1 − (1 − p)^k` → s rastúcim `k` sa blíži k 1 (pre `k = 50` je to 0,9995).
- Jednotlivé behy sú nezávislé – z predošlého pokusu sa nič neprenáša.

## Simulované žíhanie (simulated annealing)

Kombinácia hill climbingu a náhodnej prechádzky, inšpirovaná žíhaním kovov (pomalé chladnutie). V každom kroku vyberie **náhodného** suseda:

- `delta = h(sused) − h(aktuálny)`; ak `delta < 0` (lepší), prijme ho **vždy**,
- inak ho prijme s pravdepodobnosťou **`exp(−delta / T)`**,
- **teplota `T`** postupne klesá: `T = T · cooling`.

```python
def simulated_annealing(start_state, t_start=2.0, cooling=0.995, t_min=0.001, max_steps=20_000):
    current = start_state
    history = [current]
    T = t_start
    for _ in range(max_steps):
        if current.is_goal() or T < t_min:
            break
        neighbor = current.random_neighbor()
        delta = neighbor.conflicts() - current.conflicts()
        if delta < 0 or random.random() < math.exp(-delta / T):
            current = neighbor
        history.append(current)
        T = T * cooling
    return current, history
```

Pravdepodobnosť prijatia horšieho ťahu `exp(−delta / T)`:

| `delta` | `T = 10` | `T = 2` | `T = 1` | `T = 0,5` | `T = 0,1` |
|---|---|---|---|---|---|
| 0 | 1 | 1 | 1 | 1 | 1 |
| 1 | 0,905 | 0,607 | 0,368 | 0,135 | 0,00005 |
| 2 | 0,819 | 0,368 | 0,135 | 0,018 | ≈ 0 |
| 3 | 0,741 | 0,223 | 0,050 | 0,002 | ≈ 0 |

- **Vysoká `T`** → horšie ťahy sa prijímajú takmer vždy → správanie ako náhodná prechádzka (prieskum, únik z lokálnych optím).
- **Nízka `T`** → horšie ťahy sa takmer neprijímajú → správanie ako hill climbing.
- Čím **väčšie zhoršenie** (`delta`), tým menšia pravdepodobnosť prijatia.
- `delta = 0` → `exp(0) = 1` → ťah na rovnako dobrý stav sa prijme vždy.
- Ochladzovanie: `cooling` bližšie k 1 = pomalšie chladnutie, dlhší beh, lepšia šanca na globálne optimum. S `t_start = 2.0`, `cooling = 0.995`, `t_min = 0.001` klesne `T` pod `t_min` po 1 517 iteráciách; po `k` krokoch je `T = t_start · cooling^k`.
- Ak teplota klesá dostatočne pomaly, pravdepodobnosť nájdenia globálneho optima sa blíži k 1 – je to však teoretický výsledok, v praxi **záruka nie je**.
- Plán teploty z prednášky: `T(k) = T_init · (T_final / T_init)^(k / k_max)` – v kroku 0 je `T = T_init`, v kroku `k_max` je `T = T_final`. Treba zadať **počiatočnú a konečnú teplotu a maximálny počet iterácií**; teplota musí klesať **monotónne** a konečná teplota má byť **blízko nuly, ale nie 0** (delenie nulou v `exp(−delta / T)`). Plán nemusí byť práve tento – prednáška uvádza aj jednoduché `T(k+1) = T(k) − 0,05` (lineárne) alebo `T(k+1) = 0,99 · T(k)` (geometricky, ako `cooling` v cvičení).
- V AIMA je zápis pre maximalizáciu: `ΔE = hodnota(nový) − hodnota(aktuálny)`, horší ťah (`ΔE < 0`) sa prijme s pravdepodobnosťou `e^(ΔE / T)` – to isté s opačným znamienkom.

> **Na teste:** simulované žíhanie **nevyberá vždy najlepší ťah**, **môže** vykonať ťah, ktorý evaluačnú funkciu zhorší, a používa **parameter teploty**, ktorý riadi pravdepodobnosť takého ťahu a tým bráni zamrznutiu v lokálnom optime. **Nezaručuje** globálne optimum a nie je založené na biologickej evolúcii (to sú genetické algoritmy). Tvrdenie „funguje dobre v diskrétnych aj spojitých priestoroch“ sa v starších testových otázkach medzi správne charakteristiky nepočíta, hoci sa žíhanie dá použiť v oboch.

## Local beam search (lúčové vyhľadávanie)

> Priorita: nižšia. Na prednáške 2020 zaznelo, že local beam „nás nebude zaujímať“ – je tu kvôli slajdom a kvôli genetickému algoritmu, ktorý z neho vychádza.

Hill climbing pracuje s **jedným** stavom, local beam s **k** stavmi naraz:

1. Inicializácia: `k` náhodne vygenerovaných stavov.
2. Vygeneruj **všetkých potomkov** (susedov) týchto `k` stavov.
3. Ak je medzi potomkami cieľový (úplný konzistentný) stav, skonči.
4. Inak vyber `k` **najlepších potomkov** podľa evaluačnej funkcie a opakuj kroky 2–4.

- Rozdiel oproti random-restart hill climbingu (`k` nezávislých behov): v local beam si stavy **odovzdávajú informáciu** – ak jeden stav vygeneruje veľa dobrých potomkov, ostatné vetvy sa zahodia.
- Problém: potomkovia jedného rodiča môžu ovládnuť celý lúč → stratí sa rozmanitosť a algoritmus uviazne v lokálnom optime.
- **Stochastický local beam**: `k` potomkov sa vyberá **náhodne**, s pravdepodobnosťou úmernou ich hodnote (analógia prirodzeného výberu).

## Genetické algoritmy

Inšpirované **biologickou evolúciou** (prirodzený výber). Namiesto jedného stavu sa vyvíja **populácia** stavov. Prednáška ich opisuje ako **pokročilý stochastický local beam**: potomok nevzniká zo suseda jedného stavu, ale **kombináciou dvoch rodičov**.

| Pojem | Význam | V cvičení (N-dám) |
|---|---|---|
| jedinec / chromozóm | jeden kandidát riešenia | jedna doska `NQueensState` |
| gén | jedna zložka chromozómu | riadok dámy v jednom stĺpci |
| populácia | množina jedincov | `population_size = 100` dosiek |
| fitness | hodnotenie kvality jedinca | `conflicts()` – menej je lepšie |
| selekcia | výber rodičov, lepší majú väčšiu šancu | `tournament_selection(population, k=3)` |
| kríženie (crossover) | dieťa kombinuje časti dvoch rodičov | jednobodové: `self.queens[:cut] + other.queens[cut:]` |
| mutácia | malá náhodná zmena génu | `mutate()` = náhodný sused, s pravdepodobnosťou `mutation_rate = 0.5` |
| generácia | jedna iterácia = nová populácia | najviac `generations = 1000` |
| elitizmus | najlepší jedinci prechádzajú nezmenení | `elite = 2` |

```python
def genetic_algorithm(start_state, population_size=100, generations=1000, mutation_rate=0.5, elite=2):
    n = start_state.n
    population = [start_state] + [NQueensState.random(n) for _ in range(population_size - 1)]
    history = []
    for _ in range(generations):
        population.sort(key=lambda s: s.conflicts())
        history.append(population[0])
        if population[0].is_goal():
            break
        new_population = population[:elite]
        while len(new_population) < population_size:
            parent1 = tournament_selection(population)
            parent2 = tournament_selection(population)
            child = parent1.crossover(parent2)
            if random.random() < mutation_rate:
                child = child.mutate()
            new_population.append(child)
        population = new_population
    return min(population, key=lambda s: s.conflicts()), history
```

- **Fitness v prednáške** (AIMA) sa **maximalizuje**: počet dvojíc dám, ktoré sa **neohrozujú**. Pre 8 dám je minimum 0 a maximum `8 · 7 / 2 = 28` (riešenie). Cvičenie robí opak – minimalizuje `conflicts()`; platí `fitness = 28 − conflicts()`.
- **Ruletová selekcia** (z prednášky): pravdepodobnosť výberu jedinca je úmerná jeho fitness. Populácia s fitness 24, 23, 20, 11 → prvý jedinec sa vyberie s pravdepodobnosťou `24 / (24 + 23 + 20 + 11) = 24 / 78 ≈ 31 %`. Silný jedinec môže byť vybraný viackrát, slabý ani raz.
- Na začiatku sa jedinci v populácii výrazne líšia (potomok môže byť od rodičov veľmi odlišný); počas behu sa rozdiely zmenšujú a jedinci sa na seba podobajú.
- **Turnajová selekcia** (v cvičení): náhodne vyberie `k` jedincov a vráti najlepšieho z nich. Dobrý jedinec má väčšiu šancu, ale nevyberá sa vždy ten najlepší z populácie – zachováva sa rôznorodosť. Väčšie `k` = silnejší selekčný tlak.
- **Kríženie**: `cut = random.randint(1, n − 1)` (vrátane oboch hraníc) → dieťa má vždy aspoň jeden gén z každého rodiča. Príklad: `(3, 1, 4, 1, 5, 2)` × `(0, 6, 2, 7, 3, 4)`, `cut = 3` → `(3, 1, 4, 7, 3, 4)`.
- **Mutácia**: vnáša do populácie **genetickú diverzitu** – nové gény, ktoré by samotným krížením nevznikli; bráni predčasnej konvergencii (populácia rovnakých jedincov).
- **Elitizmus**: najlepšie `h` v populácii sa medzi generáciami nikdy nezhorší.
- S `population_size = 100` a `elite = 2` vznikne v každej generácii 98 detí (196 turnajov).
- GA je stochastický, **nie vždy konverguje ku globálnemu optimu**; kríženie a mutácia sú jeho kľúčové súčasti; je vhodný na optimalizačné a identifikačné problémy, nie na hľadanie najkratšej cesty v grafe.

## Porovnanie algoritmov lokálneho vyhľadávania

| | Hill climbing | Random-restart HC | Simulované žíhanie | Genetický algoritmus |
|---|---|---|---|---|
| Stavov v pamäti | 1 | 1 | 1 | populácia |
| Ďalší stav | najlepší sused | najlepší sused; po uviaznutí nový náhodný štart | náhodný sused | deti rodičov: kríženie + mutácia |
| Prijme horší stav? | nie | nie (v rámci jedného behu) | áno, s pravdepodobnosťou `exp(−delta / T)` | áno – deti môžu byť horšie než rodičia |
| Únik z lokálneho optima | žiadny | reštart | horšie ťahy pri vysokej `T` | mutácia, kríženie, populácia |
| Hlavné parametre | `max_steps` | `max_restarts` | `t_start`, `cooling`, `t_min`, `max_steps` | `population_size`, `generations`, `mutation_rate`, `elite` |
| Náhodnosť | len pri zhodách | náhodné štarty | výber suseda + prijatie | inicializácia, selekcia, kríženie, mutácia |
| Záruka globálneho optima | nie | s počtom reštartov sa pravdepodobnosť blíži k 1 | iba teoreticky pri veľmi pomalom chladnutí | nie |
| Inšpirácia | výstup na kopec | – | žíhanie kovov | biologická evolúcia |
| Úspešnosť na 8 dámach (referenčné riešenie, predvolené parametre) | ≈ 14 % | ≈ 100 % | ≈ 85 % | ≈ 80 % |

## Lokálne vs. systematické vyhľadávanie na N-dámach

V cvičení je hotové aj BFS a A* (`core/search_algorithms.py`) nad tým istým problémom: ťah = presun jednej dámy v jej stĺpci (cena 1), cieľ = žiadne konflikty, riešenie = najkratšia postupnosť ťahov. Funkcie vracajú `(goal_state alebo None, discovered, expanded)` a majú `limit` expandovaných stavov.

| Heuristika pre A* | Definícia | Prípustná? |
|---|---|---|
| `h1 = conflicts()` | počet ohrozujúcich sa dvojíc | **nie** – jeden ťah môže odstrániť viac dvojíc naraz, takže `h1` nadhodnocuje |
| `h2 = min_moves_lower_bound()` | počet konfliktných dvojíc, ktoré nezdieľajú žiadnu dámu | **áno** – každá taká dvojica potrebuje vlastný ťah |

Príklad `(0, 0, 0, 0)`: `h1 = 6`, `h2 = 2`, skutočný najmenší počet ťahov je 3 → `h1` nadhodnocuje, `h2` nie.

- BFS je slepé: nájde najkratšiu postupnosť ťahov, ale preskúma obrovský počet stavov a drží ich v pamäti.
- A* nájde najkratšiu postupnosť zaručene len s prípustnou `h2`.
- Lokálne vyhľadávanie nájde riešenie za pár krokov s jediným stavom v pamäti, ale bez záruky a bez cesty.

## Heuristický a pažravý (greedy) charakter

- **Heuristické algoritmy** vymieňajú záruky za rýchlosť: sú rýchlejšie než analytické (úplné, systematické) riešenia typu UCS, ale **nezaručujú optimálne** riešenie.
- **Pažravý (greedy) algoritmus** sa v každom kroku rozhoduje podľa **lokálne najlepšej** voľby; je často rýchlejší než algoritmy pracujúce s celým stavovým priestorom, ale nenájde vždy globálne optimum. Greedy best-first search zanedbáva skutočnú cenu zo štartu do aktuálneho stavu (`g`) a riadi sa iba heuristikou `h`.
- Hill climbing je pažravé lokálne vyhľadávanie; simulované žíhanie pažravé **nie je** (prijíma aj horšie ťahy). A* a UCS počítajú s cenou `g`, takže sa medzi greedy algoritmy neradia.

> **Na teste:** v starších testových otázkach sa pri heuristických algoritmoch uznáva „sú rýchlejšie v porovnaní s analytickými riešeniami“ a „sú kompletné, no nie optimálne“. Presnejšie: úplnosť závisí od konkrétneho algoritmu (hill climbing úplný nie je).

## Na čo sa ktorý algoritmus hodí

| Úloha | Vhodné algoritmy |
|---|---|
| Identifikačné problémy s ohraničeniami (N-dám, Sudoku, rozvrh) | hill climbing, simulované žíhanie, genetický algoritmus, min-conflicts, backtracking |
| Optimalizácia účelovej funkcie | hill climbing, simulované žíhanie, genetický algoritmus |
| Hľadanie (najkratšej) cesty v grafe | DFS, BFS, UCS, Greedy, A* – **nie** hill climbing ani genetický algoritmus |

**Min-conflicts** je hill climbing prispôsobený CSP: vyberie náhodnú premennú v konflikte a dá jej hodnotu s najmenším počtom konfliktov (podrobnosti v téme CSP).

## Typické chytáky

- Hill climbing **neprijíma** horšie stavy; pravdepodobnostné prijímanie je vlastnosť simulovaného žíhania.
- Teplota v žíhaní **klesá**; vysoká `T` = viac náhodnosti, nízka `T` = takmer hill climbing.
- `exp(−delta / T)` sa počíta len pre `delta ≥ 0`; pre lepší ťah (`delta < 0`) sa prijíma vždy.
- Mutácia = diverzita (náhodná zmena génu); kríženie = kombinácia rodičov. Nezameniť.
- Turnajová selekcia nevracia najlepšieho jedinca populácie, ale najlepšieho z `k` náhodných.
- Žiadny z týchto algoritmov **nezaručuje** globálne optimum.
- `h` je počet **dvojíc**, nie počet ohrozených dám: 4 dámy v jednom riadku = 6 konfliktov.
- Počet susedov je `N · (N − 1)`, nie `N²`.
- Výsledkom lokálneho vyhľadávania je stav, nie cesta – preto sa nehodí na hľadanie cesty v grafe.
- Local beam s `k` stavmi ≠ `k` nezávislých reštartov: do ďalšieho kola idú `k` najlepší potomkovia **všetkých** stavov spolu.
- Fitness N-dám v prednáške (neohrozujúce sa dvojice, max 28) sa **maximalizuje**; `conflicts()` v cvičení sa **minimalizuje**.

## Rýchle zhrnutie

- Lokálne vyhľadávanie drží jeden stav (GA populáciu), má malú pamäť a vracia koncový stav, nie cestu.
- N-dám: `queens[col] = row`, `h` = počet ohrozujúcich sa dvojíc, sused = presun jednej dámy v stĺpci, `N · (N − 1)` susedov.
- Hill climbing: choď do najlepšieho suseda, skonči, keď žiaden nie je lepší; uviazne v lokálnom maxime, na planine a hrebeni.
- Planina (plateau) = oblasť, kde majú susedné stavy približne rovnakú hodnotu.
- Hill climbing na 8 dámach uspeje asi v 14 % prípadov.
- Random restart: opakuj hill climbing z náhodných štartov; očakávaný počet behov `1 / p`.
- Simulované žíhanie: náhodný sused, lepší vždy, horší s pravdepodobnosťou `exp(−delta / T)`.
- Teplota klesá (`T = T · cooling`): vysoká = prieskum, nízka = hill climbing.
- Genetický algoritmus: populácia, fitness, selekcia, kríženie, mutácia, elitizmus; inšpirácia evolúciou; „pokročilý stochastický local beam“.
- Local beam: `k` stavov → `k` najlepších spomedzi všetkých potomkov (stochastická verzia náhodne podľa hodnoty); ruletová selekcia = fitness / súčet fitness.
- Mutácia vnáša genetickú diverzitu; kríženie kombinuje rodičov; turnaj vracia najlepšieho z `k` náhodných.
- Žiadny z algoritmov nezaručuje globálne optimum.
- `h1 = conflicts` nie je prípustná heuristika pre A*, `h2` (dolný odhad) je.
- Hill climbing, žíhanie, GA a min-conflicts riešia identifikačné problémy; cestu v grafe hľadajú DFS, BFS, UCS, Greedy, A*.
- Funkcie v `core/algorithms.py` vracajú `(final_state, history)`.
