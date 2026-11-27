**O čo ide:** to isté, čo sme pri Titanicu robili ručne (doplnenie chýbajúcich hodnôt priemerom), vie scikit-learn spraviť jedným nástrojom – `SimpleImputer`. Aby bolo čo dopĺňať, najprv si do dát schválne narobíme diery.

### Krok za krokom

1. `iris = datasets.load_iris()` a `iris_X = iris.data` – dataset kosatcov, 150 kvetov × 4 miery.
2. **Výroba dier:**
    - `rng = np.random.default_rng(0)` – generátor náhodných čísel (nula = vždy rovnaký výsledok),
    - `rng.binomial(1, .25, iris_X.shape).astype(bool)` – tabuľka rovnakého tvaru ako dáta, v ktorej je s pravdepodobnosťou 25 % `True`. To je **maska**: kde je `True`, tam vymažeme,
    - `iris_X[masking_array] = np.nan` – na označené miesta zapíše `NaN`.
3. `print(iris_X[:5])` – prvých päť riadkov, vidno v nich `nan`.
4. `impute = SimpleImputer()` – vytvorí dopĺňač. Predvolená stratégia je `mean` = priemer **stĺpca**.
5. `iris_X_prime = impute.fit_transform(iris_X)` – `fit` vypočíta priemer každého stĺpca (z hodnôt, ktoré nechýbajú), `transform` ním zaplní diery. Oboje naraz.
6. `SimpleImputer(strategy='median')` – to isté, ale dopĺňa **medián** (prostrednú hodnotu). Ten je odolnejší voči extrémnym hodnotám.
7. `known, imputed = ~masking_array[:, 2], masking_array[:, 2]` – pre stĺpec 2: ktoré hodnoty boli pôvodné a ktoré doplnené.
8. `ax.hist([...], stacked=True, ...)` – histogram, kde sú pôvodné a doplnené hodnoty farebne odlíšené. Doplnené tvoria jeden vysoký stĺpec – všetky majú rovnakú hodnotu (priemer alebo medián).

### Ako si to zapamätať

- Dva riadky: `SimpleImputer()` → `fit_transform(X)`.
- Stratégie: `mean` (predvolená), `median`, `most_frequent`.
- Dopĺňa sa **po stĺpcoch** – každý príznak má vlastný priemer.
