**O čo ide:** BFS (prehľadávanie do šírky) hľadá riešenie hlavolamu **po vrstvách**: najprv všetky stavy na 1 ťah od štartu, potom na 2 ťahy, potom na 3… Preto prvé riešenie, ktoré nájde, je vždy **najkratšie**.

Celé to drží **rad (fronta)**: nové stavy idú na koniec, berie sa zo začiatku – ako v rade v obchode (FIFO).

### Krok za krokom

1. `frontier = deque([start_state])` – rad stavov, ktoré čakajú na preskúmanie. Na začiatku je v ňom len štart. `deque` je zoznam, z ktorého sa dá rýchlo brať zľava.
2. `visited = {start_state}` – množina stavov, ktoré sme už videli. Bez nej by sme chodili stále dokola.
3. `discovered = 1`, `expanded = 0` – počítadlá: koľko stavov sme objavili a koľko preskúmali.
4. `while frontier:` – opakuj, kým je v rade aspoň jeden stav.
5. `current_state = frontier.popleft()` – vezmi stav **zo začiatku** radu. Toto jediné slovo robí z algoritmu BFS.
6. `if current_state.is_goal():` – je to cieľ? Ak áno, vráť ho aj s počítadlami a končíme.
7. `for tile in current_state.get_possible_moves():` – inak prejdi všetky možné ťahy.
8. `next_state = current_state.move_tile(tile)` – stav po ťahu.
9. `if next_state not in visited:` – ak sme ho ešte nevideli:
    - `visited.add(next_state)` – označ ako videný,
    - `frontier.append(next_state)` – zaraď **na koniec** radu,
    - `discovered += 1`.
10. `return None, discovered, expanded` – rad sa vyprázdnil a cieľ sme nenašli → riešenie neexistuje.

### Ako si to zapamätať

- Kostra každého prehľadávania: **zoznam čakajúcich stavov + množina videných + cyklus (vyber → cieľ? → rozviň susedov)**.
- BFS = `popleft()` (rad, FIFO). DFS = `pop()` (zásobník, LIFO). Inak je kód takmer rovnaký.
- Stav sa do `visited` pridáva hneď pri **objavení**, nie až pri vyberaní – inak by sa v rade ocitol viackrát.
- BFS nájde najkratšiu cestu, ale pamätá si obrovské množstvo stavov.
