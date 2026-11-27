**O čo ide:** DFS (prehľadávanie do hĺbky) ide **stále ďalej jednou cestou**, kým sa dá; až keď narazí, vráti sa o krok späť a skúsi inú odbočku. Riešenie nájde, ale býva zbytočne dlhé – nie je zaručene najkratšie.

Drží to **zásobník**: nové stavy sa kladú navrch a berie sa tiež zvrchu – ako kôpka tanierov (LIFO).

### Krok za krokom

1. `stack = [start_state]` – zásobník je obyčajný zoznam. Na začiatku obsahuje štart.
2. `visited = {start_state}` – množina už videných stavov.
3. `while stack:` – opakuj, kým zásobník nie je prázdny.
4. `if expanded >= limit:` – **poistka**. DFS sa vie zatúlať veľmi hlboko, preto po 50 000 preskúmaných stavoch končíme s `None`.
5. `current_state = stack.pop()` – vezmi stav **z konca** zoznamu, teda ten, ktorý sme pridali naposledy. Toto robí z algoritmu DFS.
6. `if current_state.is_goal():` – cieľ? Vráť ho.
7. `for tile in current_state.get_possible_moves():` – prejdi možné ťahy.
8. `next_state = current_state.move_tile(tile)` – stav po ťahu.
9. `if next_state not in visited:` – ak je nový: `visited.add(next_state)`, `stack.append(next_state)` (navrch zásobníka), `discovered += 1`.
10. `return None, discovered, expanded` – nič sa nenašlo.

### Porovnaj s BFS

| | BFS | DFS |
|---|---|---|
| štruktúra | rad `deque` | zásobník `list` |
| výber | `popleft()` – najstarší | `pop()` – najnovší |
| cesta | najkratšia | hocijaká, často veľmi dlhá |
| pamäť | veľa | menej |

### Ako si to zapamätať

- Napíš BFS a zmeň tri veci: `deque` → zoznam, `popleft()` → `pop()`, pridaj kontrolu `limit`.
- V ukážke z cvičenia nájde DFS cestu dlhú 40 828 ťahov tam, kde BFS nájde 16.
