**O čo ide:** chceme zistiť, s akým nastavením je rozhodovací strom najlepší. Vyskúšame **každú kombináciu** dvoch hyperparametrov a zapíšeme si jej presnosť. Tomu sa hovorí prehľadávanie mriežky (grid search) – tu ho robíme ručne, aby bolo vidno, čo sa pod kapotou deje.

### Krok za krokom

1. `datasets.make_classification(n_samples=2000, n_features=10, random_state=5)` – 2000 umelých vzoriek.
2. `criteria = ['gini', 'entropy']` a `max_features = ['sqrt', 5, None]` – hodnoty, ktoré chceme vyskúšať: 2 možnosti pre `criterion`, 3 pre `max_features`.
3. `parameter_space = it.product(criteria, max_features)` – všetky dvojice: 2 × 3 = **6 kombinácií**. To je tá „mriežka“.
4. **Rozdelenie maskou:** `train_set = rng.choice([True, False], size=len(y))` – pre každú vzorku náhodne `True` alebo `False`. `True` = patrí do tréningu, takže zhruba polovica.
    - `X[train_set]` – trénovacie vzorky,
    - `X[~train_set]` – ostatné (vlnovka masku obráti) = testovacie.
5. `accuracies = {}` – prázdny slovník na výsledky.
6. `for criterion, max_feature in parameter_space:` – cyklus cez 6 kombinácií. V každom kole:
    - `DecisionTreeClassifier(criterion=criterion, max_features=max_feature, random_state=5)` – strom s touto kombináciou,
    - `dt.fit(X[train_set], y[train_set])` – učenie,
    - `(dt.predict(X[~train_set]) == y[~train_set]).mean()` – presnosť na teste; uloží sa do slovníka pod kľúč `(criterion, max_feature)`.
7. `print(accuracies)` – 6 presností. Koniec kódu z nich kreslí farebnú tabuľku (`matshow`).

### Ako si to zapamätať

- Mriežka = zoznamy hodnôt → `it.product` → cyklus → slovník výsledkov.
- Kľúč slovníka je dvojica `(criterion, max_feature)`, hodnota je presnosť.
- `it.product` sa dá prejsť **len raz** – po cykle je prázdny.
- Presne toto robí `GridSearchCV` automaticky (a navyše s krížovou validáciou).
