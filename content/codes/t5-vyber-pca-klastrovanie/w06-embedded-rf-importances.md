**O čo ide:** **vnorená (embedded) metóda** – dôležitosť príznakov vypadne ako vedľajší produkt učenia modelu. Náhodný les si počas učenia sám poznačí, ktoré príznaky mu najviac pomáhali. My si podľa toho vyberieme tie nadpriemerné.

### Krok za krokom

1. Načítanie `X`, `y` a mien príznakov – opäť dáta o srdci.
2. `rf = RandomForestClassifier(n_estimators=200, random_state=5)` – les s 200 stromami.
3. `rf.fit(X, y)` – obyčajné učenie. Nič špeciálne na výber príznakov.
4. `rf.feature_importances_` – po učení je tu 13 čísel, jedno na príznak. Spolu dávajú 1. Väčšie číslo = stromy sa podľa tohto príznaku rozhodovali častejšie a užitočnejšie.
5. `order = np.argsort(rf.feature_importances_)[::-1]` – indexy príznakov od najdôležitejšieho (ten istý trik ako pri `SelectKBest`).
6. `for i in order:` – výpis mien a dôležitostí: `cp 0.147`, `thalach 0.117`, …
7. `selector = SelectFromModel(rf, threshold='mean', prefit=True)`:
    - `rf` – model, z ktorého sa dôležitosti berú,
    - `threshold='mean'` – nechaj príznaky s dôležitosťou **nad priemerom**,
    - `prefit=True` – model je **už naučený**, netreba ho učiť znova.
8. `X_selected = selector.transform(X)` – ponechá len vybrané stĺpce. (Stačí `transform`, lebo vďaka `prefit=True` nie je čo „fitovať“.)
9. `feature_names[selector.get_support()]` – mená vybraných príznakov.

### Ako si to zapamätať

- Tri druhy výberu príznakov:
    - **filter** – štatistika, bez modelu (`VarianceThreshold`, `SelectKBest`),
    - **wrapper** – opakované učenie modelu (`RFECV`),
    - **embedded** – dôležitosť z jedného naučeného modelu (`feature_importances_` + `SelectFromModel`).
- Poradie: `fit` lesa → `feature_importances_` → `SelectFromModel(..., prefit=True)` → `transform`.
