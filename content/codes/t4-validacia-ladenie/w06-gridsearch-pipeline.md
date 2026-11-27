**O čo ide:** spojíme dve veci – **pipeline** (škálovanie + model ako jeden celok) a **`GridSearchCV`** (hľadanie najlepších nastavení). Pipeline zaručí, že sa škálovač v každom folde učí len z trénovacej časti.

### Krok za krokom

1. `np.load(...)` – načíta dáta o chorobách srdca: 303 pacientov, 13 príznakov, odpoveď 0/1.
2. `pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC())])` – zoznam krokov. Každý krok je dvojica **(meno, nástroj)**: najprv škálovač s menom `scl`, potom klasifikátor s menom `clf`. Pipeline sa navonok správa ako jeden model (`fit`, `predict`, `score`).
3. `param_range = [0.001, 0.01, 0.1, 1, 10, 100]` – šesť hodnôt, ktoré budeme skúšať.
4. `param_grid = [ {...}, {...}, {...} ]` – **zoznam troch slovníkov**, jeden pre každé jadro SVM, lebo každé má iné parametre:
    - `linear` – len `C` → 6 kombinácií,
    - `rbf` – `C` a `gamma` → 6 × 6 = 36,
    - `poly` – `C`, `gamma` a `degree` → 6 × 6 × 3 = 108.
    - Spolu **150 kombinácií**.
5. Názvy ako `clf__C`: **meno kroku + dva podčiarkovníky + názov parametra**. Tak `GridSearchCV` vie, že `C` patrí kroku `clf`.
6. `train_test_split(X, y, test_size=0.3, random_state=1)` – 30 % si odložíme bokom na záverečný test.
7. `gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=5, n_jobs=-1)` – `scoring='accuracy'` = hodnotíme presnosťou, `n_jobs=-1` = použi všetky jadrá procesora.
8. `gs = gs.fit(X_train, y_train)` – hľadanie beží **len na trénovacích dátach**.
9. Výsledky: `gs.cv_results_['mean_test_score']` (150 hodnôt), `gs.best_score_` (`0.85`), `gs.best_params_`.
10. `gs.score(X_test, y_test)` – najlepší model sa nakoniec vyskúša na odložených dátach, ktoré pri ladení nikdy nevidel.

### Ako si to zapamätať

- Pipeline = zoznam dvojíc `(meno, nástroj)`; posledný krok je model.
- Parameter v mriežke = `meno__parameter` (dva podčiarkovníky).
- Ladíme na `train` (vnútri s krížovou validáciou), `test` otvoríme až úplne na konci.
