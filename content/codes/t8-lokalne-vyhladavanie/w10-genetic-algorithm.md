**O čo ide:** genetický algoritmus nepracuje s jedným stavom, ale s celou **populáciou** (tu 100 dosiek naraz). Napodobňuje evolúciu: lepšie dosky majú „deti“, deti dedia časti od oboch rodičov a občas zmutujú. Generáciu po generácii sa populácia zlepšuje.

Slovník: **jedinec** = jedna doska, **fitness** = počet konfliktov (menej je lepšie), **generácia** = jedno kolo cyklu.

### Krok za krokom

1. `population = [start_state] + [NQueensState.random(n) for _ in range(population_size - 1)]` – počiatočná populácia: zadaná doska a k nej 99 náhodných.
2. `for _ in range(generations):` – najviac 1000 generácií.
3. `population.sort(key=lambda s: s.conflicts())` – zoraď dosky od najlepšej (najmenej konfliktov). Na pozícii `0` je teraz najlepšia.
4. `history.append(population[0])` – zapíš si najlepšiu dosku generácie.
5. `if population[0].is_goal(): break` – ak nemá konflikty, máme riešenie.
6. `new_population = population[:elite]` – **elitizmus**: 2 najlepšie dosky prejdú do ďalšej generácie bez zmeny, aby sa to najlepšie nestratilo.
7. `while len(new_population) < population_size:` – zvyšok novej generácie doplníme deťmi:
    - `parent1 = tournament_selection(population)` – **výber rodiča turnajom**: náhodne sa vyberú 3 dosky a vyhrá najlepšia z nich. To isté pre `parent2`,
    - `child = parent1.crossover(parent2)` – **kríženie**: dieťa dostane ľavú časť dosky od prvého rodiča a pravú od druhého (rez na náhodnom mieste),
    - `if random.random() < mutation_rate: child = child.mutate()` – **mutácia**: s pravdepodobnosťou 50 % sa jedna náhodná dáma presunie,
    - `new_population.append(child)` – dieťa ide do novej generácie.
8. `population = new_population` – nová generácia nahradí starú.
9. `return min(population, key=lambda s: s.conflicts()), history` – po skončení vráti najlepšiu dosku (a históriu).

### Ako si to zapamätať

Jedna generácia = **zoraď → cieľ? → elita → (výber → kríženie → mutácia) dokola, kým nie je plno → vymeň populáciu**.

- Výber dáva šancu lepším, kríženie mieša dobré časti, mutácia prináša novinky (bez nej by sa populácia zasekla).
- `sort(key=...)` a `min(..., key=...)` – `key` je funkcia, podľa ktorej sa porovnáva; tu počet konfliktov.
- Je to tiež lokálne vyhľadávanie: nezaujíma nás cesta, len výsledný stav.
