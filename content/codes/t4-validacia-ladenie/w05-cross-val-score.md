**O čo ide:** celú krížovú validáciu (rozkrájať dáta, K-krát naučiť, K-krát ohodnotiť) spraví **jedna funkcia** – `cross_val_score`. Vráti K čísel, jedno skóre za každý fold.

### Krok za krokom

1. `X, y = datasets.make_regression(10000, 10, random_state=5)` – 10 000 vzoriek, 10 príznakov, úloha je regresia (hádame číslo).
2. `rf = ensemble.RandomForestRegressor(max_features='log2')` – náhodný les pre regresiu. Všimni si: **nevoláme `fit`**. Model len odovzdáme ďalej.
3. `scores = model_selection.cross_val_score(rf, X, y, cv=5)` – tu sa deje všetko:
    - dáta sa rozdelia na 5 foldov,
    - 5-krát sa les naučí na štyroch a ohodnotí na piatom,
    - vráti sa pole 5 čísel.
4. Čo je to skóre? Pri regresii je predvolené **R²** (pri klasifikácii by to bola presnosť).
5. `print(scores)` – päť hodnôt okolo `0.91`. `np.mean(scores)` – ich priemer, to je výsledné hodnotenie modelu.
6. `plt.bar(range(1, 6), scores)` a `plt.axhline(np.mean(scores), color='red')` – stĺpec za každý fold a červená čiara priemeru.
7. **Bonus:** to isté pre `linear_model.LinearRegression()`. Vyjde `1.0`, lebo `make_regression` vyrába presne lineárne dáta – lineárny model ich trafí dokonale.
8. `plt.boxplot([scores, lin_scores])` – porovnanie oboch modelov vedľa seba.

### Ako si to zapamätať

- `cross_val_score(model, X, y, cv=5)` – štyri argumenty: čo, na čom, koľko foldov.
- Model sa odovzdáva **nenaučený**; funkcia si ho učí sama v každom folde.
- Výsledok je pole → vždy z neho sprav `np.mean`.
