**O čo ide:** ručné skúšanie kombinácií nahradí hotový nástroj **`GridSearchCV`**. Dáš mu model a slovník hodnôt, on vyskúša všetky kombinácie, každú ohodnotí krížovou validáciou a povie, ktorá je najlepšia.

### Krok za krokom

1. `X, y = make_classification(1000, n_features=5, random_state=5)` – 1000 vzoriek, 5 príznakov.
2. `lr = LogisticRegression(class_weight='balanced', solver='liblinear')` – model, ktorý ideme ladiť. Opäť ho **neučíme**, len pripravíme.
3. `param_grid = {'l1_ratio': [0, 1], 'C': [0.001, 0.01, 0.1, 1, 10, 100]}` – mriežka ako slovník: **kľúč = názov parametra modelu**, hodnota = zoznam, čo skúsiť.
    - `l1_ratio`: `0` = regularizácia L2, `1` = L1,
    - `C`: sila regularizácie naopak – malé `C` = silná regularizácia (jednoduchší model).
    - Spolu 2 × 6 = **12 kombinácií**.
4. `gs = GridSearchCV(lr, param_grid, cv=5)` – model, mriežka, počet foldov. Každá z 12 kombinácií sa ohodnotí 5-fold krížovou validáciou → 60 učení.
5. `gs.fit(X, y)` – až tu sa všetko spustí.
6. `gs.best_params_` – víťazná kombinácia: `{'C': 1, 'l1_ratio': 0}`.
7. `gs.best_score_` – jej priemerná presnosť z 5 foldov: `0.912`.
8. `gs.cv_results_` – slovník so všetkými výsledkami. `['params']` sú kombinácie, `['mean_test_score']` ich priemerné skóre; `zip` ich spáruje a cyklus vypíše všetkých 12 riadkov.

### Ako si to zapamätať

- Tri riadky: `param_grid = {...}` → `GridSearchCV(model, param_grid, cv=5)` → `.fit(X, y)`.
- Tri výsledky: `best_params_`, `best_score_`, `cv_results_` (všetky s podčiarkovníkom = existujú až po `fit`).
- Počet učení = počet kombinácií × počet foldov.
