**O čo ide:** niektorým cestujúcim Titanicu chýba vek (v dátach je `NaN` = „nie je číslo“). Model s dierami pracovať nevie, tak chýbajúci vek nahradíme **priemerným vekom** ostatných. Volá sa to imputácia.

### Krok za krokom

1. `titanic_data = pd.read_csv('data/titanic.txt')` – načíta tabuľku cestujúcich.
2. `titanic_y = np.array(titanic_data.survived)` – stĺpec `survived` (prežil 1 / neprežil 0) je to, čo chceme predpovedať. Odložíme si ho bokom ako `y`.
3. `titanic_data.drop(columns=[...])` – zahodí stĺpce, ktoré nepoužijeme (meno, lístok, čln…). Ostanú tri: `pclass`, `age`, `sex`.
4. `titanic_reduced.loc[12]` – vypíše cestujúceho s označením 12. Má `age NaN` – na ňom uvidíme zmenu.
5. `ages = titanic_reduced.iloc[:, 1]` – vyberie **druhý stĺpec** (počíta sa od 0), čo je `age`. `iloc` vyberá podľa poradia, `:` znamená „všetky riadky“.
6. `ages = np.array(ages)` – prevedie stĺpec na pole NumPy.
7. `np.isnan(ages)` – pole `True`/`False`: kde vek chýba. Vlnovka `~` ho obráti, takže `ages[~np.isnan(ages)]` sú **len známe** veky.
8. `mean_age = np.mean(...)` – priemer známych vekov (asi 31,19). Z poľa s `NaN` by priemer vyšiel `NaN`, preto ich treba najprv vynechať.
9. `ages[np.isnan(ages)] = mean_age` – na miesta, kde vek chýbal, zapíše priemer.
10. `titanic_reduced["age"] = ages` – opravený stĺpec vráti do tabuľky.

### Ako si to zapamätať

Päť riadkov, päť slov: **vyber** stĺpec → **preveď** na pole → **spočítaj** priemer známych → **doplň** na chýbajúce miesta → **vráť** do tabuľky.

- `np.isnan(x)` = kde chýba, `~np.isnan(x)` = kde nechýba.
- Pole v hranatých zátvorkách s `True`/`False` vyberie len prvky, kde je `True`.
