**O čo ide:** príznak, ktorý má u všetkých takmer rovnakú hodnotu, nič nehovorí – podľa neho sa nedá nikoho rozlíšiť. `VarianceThreshold` také príznaky vyhodí. Je to **filtračná metóda**: pozerá len na samotné príznaky, nepotrebuje model ani odpovede `y`.

Rozptyl (variance) = ako veľmi sa hodnoty líšia od priemeru. Malý rozptyl = hodnoty sú skoro rovnaké.

### Krok za krokom

1. `data = pd.read_csv('employees_research.csv').drop(columns=['ID'])` – načíta tabuľku zamestnancov a zahodí `ID` (je to len poradové číslo, nie vlastnosť).
2. `rng = np.random.default_rng(5)` – generátor náhodných čísel.
3. `data["spam"] = rng.uniform(low=0.9, high=1.1, size=len(data))` – **schválne** pridáme zbytočný stĺpec `spam`: náhodné čísla tesne okolo 1. Jeho rozptyl je maličký (asi 0,003).
4. `print(data.shape)` → `(100, 4)`. `print(data.var())` – rozptyl každého stĺpca: `salary` obrovský, `graduated` 0,083, `spam` 0,0035.
5. `selector = VarianceThreshold(threshold=0.05)` – nástroj s prahom: vyhodí príznaky, ktorých rozptyl **nie je väčší než 0,05**.
6. `new_selection = selector.fit_transform(data)` – `fit` spočíta rozptyly, `transform` nechá len stĺpce nad prahom. Všimni si: dostal **len `data`**, žiadne `y`.
7. `print(new_selection.shape)` → `(100, 3)`: jeden stĺpec zmizol.
8. `selector.get_feature_names_out()` – mená stĺpcov, ktoré ostali.
9. `selector.get_support()` – maska `True`/`False` (ostal / neostal). S vlnovkou `~` dostaneme vyhodené: `data.columns[~selector.get_support()]` → `spam`.

### Ako si to zapamätať

- Dva riadky: `VarianceThreshold(threshold=...)` → `fit_transform(data)`.
- Filter = bez modelu a bez `y`.
- `get_support()` má každý výberový nástroj – hovorí, ktoré príznaky prešli.
