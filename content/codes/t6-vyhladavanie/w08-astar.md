**O čo ide:** A* spája to najlepšie z oboch svetov. Pri výbere stavu sčíta dve čísla:

- `g(n)` – koľko ťahov sme **už spravili** od štartu,
- `h(n)` – koľko ťahov **ešte asi treba** do cieľa (heuristika),
- `f(n) = g(n) + h(n)` – odhad dĺžky celej cesty cez tento stav.

Vždy vyberie stav s najmenším `f`. S prípustnou heuristikou nájde **najkratšiu cestu** a preskúma oveľa menej stavov než BFS.

### Krok za krokom

1. `open_list = [(heuristic(start_state), state_id, start_state)]` – halda trojíc `(f, poradové číslo, stav)`. Pre štart je `g = 0`, takže `f = h`.
2. `closed_list = set()` – preskúmané stavy.
3. `g = {start_state: 0}` – slovník: **najlacnejšia doteraz známa cesta** do každého stavu. Toto greedy nemá.
4. `_, _id, current = heapq.heappop(open_list)` – vyber stav s najmenším `f`.
5. `if current in closed_list: continue` – ten istý stav môže byť v halde viackrát (s horšou aj lepšou cestou). Ak už bol preskúmaný, starú kópiu zahodíme.
6. `if current.is_goal():` → vráť. Inak `closed_list.add(current)`.
7. Pre každého suseda `neighbor`:
    - `if neighbor in closed_list: continue` – preskúmaný preskoč,
    - `tentative_g = g[current] + 1` – cena cesty do suseda **cez aktuálny stav**: o jeden ťah viac,
    - `if tentative_g < g.get(neighbor, float("inf")):` – je to lepšie než to, čo o susedovi vieme? (`g.get(..., inf)` vráti nekonečno, ak sme ho ešte nevideli – vtedy je lepšie čokoľvek.)
    - ak áno: `g[neighbor] = tentative_g` – zapíš lepšiu cenu,
    - `heapq.heappush(open_list, (tentative_g + heuristic(neighbor), state_id, neighbor))` – vlož suseda s prioritou **`g + h`**.

### Ako si to zapamätať

- Jediný riadok, ktorý robí z algoritmu A*: priorita `tentative_g + heuristic(neighbor)`.
    - len `h` → greedy,
    - len `g` → UCS (rovnomerná cena),
    - `g + h` → A*.
- Navyše oproti greedy: slovník `g` a podmienka „našiel som lacnejšiu cestu?“.
- V ukážke: A* nájde 14 ťahov a preskúma 77 stavov; BFS nájde tiež 14, ale preskúma 5961.
