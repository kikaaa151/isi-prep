**O čo ide:** pažravé (greedy) vyhľadávanie vždy siahne po stave, ktorý **vyzerá najbližšie k cieľu** podľa heuristiky `h`. Nezaujíma ho, koľko ťahov už spravil. Je rýchle, ale cesta nemusí byť najkratšia.

Namiesto radu či zásobníka používa **prioritnú frontu (haldu)**: vždy z nej vypadne prvok s najmenším číslom.

### Krok za krokom

1. `open_list = [(heuristic(start_state), state_id, start_state)]` – zoznam čakajúcich stavov. Každý prvok je **trojica**:
    - `h` – odhad vzdialenosti do cieľa (podľa neho sa triedi),
    - `state_id` – poradové číslo. Ak majú dva stavy rovnaké `h`, Python porovná toto číslo a nemusí porovnávať samotné stavy (to nevie),
    - samotný stav.
2. `in_open = {start_state}` – množina stavov, ktoré práve čakajú v `open_list` (aby sme ich nepridali dvakrát).
3. `closed_list = set()` – stavy, ktoré sú už preskúmané.
4. `_, _id, current = heapq.heappop(open_list)` – vyber stav s **najmenším `h`**. Podčiarkovníky sú hodnoty, ktoré nepotrebujeme.
5. `in_open.remove(current)` – už nečaká. `if current.is_goal():` – ak je to cieľ, vráť ho.
6. `closed_list.add(current)` – označ ako preskúmaný.
7. Pre každý ťah: `neighbor = current.move_tile(tile)`.
    - `if neighbor in closed_list: continue` – už preskúmaný → preskoč,
    - `if neighbor not in in_open:` – ak ešte nečaká v rade:
        - `state_id += 1`,
        - `heapq.heappush(open_list, (heuristic(neighbor), state_id, neighbor))` – vlož ho s prioritou `h`,
        - `in_open.add(neighbor)`, `discovered += 1`.
8. `return None, ...` – otvorený zoznam sa vyprázdnil, riešenie nie je.

### Ako si to zapamätať

- Tri vyhľadávania, tri „zásobníky“: BFS rad, DFS zásobník, greedy/A* **halda** (`heapq.heappop`, `heapq.heappush`).
- Greedy: priorita = **len `h(n)`**. A*: priorita = `g(n) + h(n)`.
- V ukážke nájde greedy cestu dlhú 36 ťahov (optimum je 14), ale preskúma len 179 stavov – rýchle, nie najlepšie.
