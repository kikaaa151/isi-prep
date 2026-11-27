**O čo ide:** hill climbing uviazne, lebo nikdy nespraví krok k horšiemu. Simulované žíhanie to rieši: **občas prijme aj horší stav**. Na začiatku často (vysoká „teplota“), postupne čoraz zriedkavejšie (teplota klesá). Na začiatku teda skúma, na konci už len dolaďuje.

Názov je z hutníctva: kov sa pomaly ochladzuje, aby sa usadil do pevnej štruktúry.

### Krok za krokom

1. Parametre: `t_start=2.0` počiatočná teplota, `cooling=0.995` koeficient ochladzovania, `t_min=0.001` teplota, pri ktorej končíme, `max_steps` poistka.
2. `current = start_state`, `history = [current]`, `T = t_start` – aktuálny stav a aktuálna teplota.
3. `if current.is_goal() or T < t_min: break` – koniec, ak máme riešenie **alebo** sme už vychladli.
4. `neighbor = current.random_neighbor()` – **náhodný** sused (náhodná dáma na náhodný riadok). Nie najlepší ako pri hill climbingu!
5. `delta = neighbor.conflicts() - current.conflicts()` – o koľko je sused horší:
    - záporné → sused je **lepší**,
    - kladné → sused je **horší**.
6. `if delta < 0 or random.random() < math.exp(-delta / T):` – kedy sa presunieme:
    - `delta < 0` – lepšieho suseda berieme **vždy**,
    - inak s pravdepodobnosťou `exp(-delta / T)`. `random.random()` dá náhodné číslo medzi 0 a 1; ak je menšie než pravdepodobnosť, berieme.
7. `current = neighbor` – presun.
8. `history.append(current)` – zapíš krok (aj keď sme ostali stáť).
9. `T = T * cooling` – ochlaď: teplota klesne na 99,5 % predchádzajúcej.

### Ako čítať `exp(-delta / T)`

| situácia | hodnota | čo to znamená |
|---|---|---|
| o 1 horší, `T = 2` | `exp(-0.5)` ≈ 0,61 | často prijmeme |
| o 1 horší, `T = 0.1` | `exp(-10)` ≈ 0,00005 | takmer nikdy |
| o 3 horší, `T = 2` | `exp(-1.5)` ≈ 0,22 | zriedkavejšie |
| rovnako dobrý (`delta = 0`) | `exp(0)` = 1 | vždy |

Čím **vyššia teplota** a čím **menšie zhoršenie**, tým skôr horší krok prijmeme.

### Ako si to zapamätať

- Telo cyklu: **koniec? → náhodný sused → `delta` → prijať? → ochladiť**.
- Dva rozdiely oproti hill climbingu: sused je náhodný a horší krok je povolený s pravdepodobnosťou `exp(-delta / T)`.
- Ochladzovanie je násobenie: `T = T * cooling`.
