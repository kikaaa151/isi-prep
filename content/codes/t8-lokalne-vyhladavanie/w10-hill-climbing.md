**O čo ide:** hill climbing (horolezecký algoritmus) je najjednoduchšie lokálne vyhľadávanie: **pozri sa na všetky susedné stavy, prejdi do najlepšieho, opakuj**. Skončí, keď už žiadny sused nie je lepší. Nepamätá si cestu ani iné stavy – má len jeden aktuálny stav.

Sused = doska, na ktorej sa **jedna dáma posunula vo svojom stĺpci**. „Lepší“ = menej konfliktov.

### Krok za krokom

1. `current = start_state` – aktuálny stav, začíname zo zadanej dosky.
2. `history = [current]` – zoznam stavov, cez ktoré sme prešli (len na zobrazenie).
3. `for _ in range(max_steps):` – najviac 1000 krokov. Podčiarkovník = číslo kroku nepotrebujeme.
4. `if current.is_goal(): break` – nula konfliktov → hotovo, vyskoč z cyklu.
5. `neighbor = current.best_neighbor()` – zo všetkých susedov vyber toho s **najmenším** počtom konfliktov.
6. `if neighbor.conflicts() >= current.conflicts(): break` – ani najlepší sused nie je lepší než my? Potom sa niet kam pohnúť → koniec.
7. `current = neighbor` – inak prejdi do suseda.
8. `history.append(current)` – zapíš krok.
9. `return current, history` – vráti stav, kde skončil, a históriu.

### Kde je háčik

Krok 6 znamená, že algoritmus **uviazne v lokálnom minime**: v stave, kde sú všetci susedia horší alebo rovnakí, hoci to ešte nie je riešenie. Na 8 dámach takto vyrieši len asi 14 % náhodných dosiek. Riešenia: skúsiť znova z inej náhodnej dosky (random restart) alebo občas dovoliť krok k horšiemu (simulované žíhanie).

### Ako si to zapamätať

- Telo cyklu má štyri kroky: **cieľ? → najlepší sused → nie je lepší? koniec → presuň sa**.
- Podmienka je `>=`: zastaví sa aj vtedy, keď je sused **rovnako** dobrý (nechodí po rovine).
- Menšie číslo je lepšie (minimalizujeme konflikty), aj keď sa algoritmus volá „stúpanie na kopec“.
