**O čo ide:** z 13 príznakov pacienta vyberieme **5 najlepších**. Každý príznak dostane známku podľa toho, ako dobre **sám osebe** súvisí s odpoveďou (chorý / zdravý). Je to stále filtračná metóda (bez modelu), ale na rozdiel od `VarianceThreshold` už používa `y`.

### Krok za krokom

1. `X = np.load('X_data.npy')`, `y = np.load('y_data.npy')` – dáta o chorobách srdca, 303 pacientov × 13 príznakov.
2. `feature_names = np.array([...])` – mená 13 príznakov, aby sme vedeli výsledok prečítať. Je to pole NumPy, aby sa dalo indexovať maskou.
3. `kbest = SelectKBest(f_classif, k=5).fit(X, y)` – v jednom riadku:
    - `f_classif` – funkcia, ktorá známkuje príznaky (ANOVA F-test: líšia sa hodnoty príznaku medzi triedami?),
    - `k=5` – nechaj 5 najlepších,
    - `.fit(X, y)` – spočítaj známky. Potrebuje aj `y`.
4. `kbest.scores_` – známka každého príznaku (vyššia = užitočnejší).
5. `order = np.argsort(kbest.scores_)[::-1]` – `argsort` vráti **poradie indexov** od najmenšej známky; `[::-1]` ho otočí, takže ide od najlepšieho.
6. `for i in order:` – vypíše mená a známky zoradené zostupne (`exang 71.0`, `cp 69.8`, …).
7. `X_selected = kbest.transform(X)` – ponechá len 5 víťazných stĺpcov → tvar `(303, 5)`.
8. `feature_names[kbest.get_support()]` – mená vybraných príznakov (maska `True` pri piatich).

### Ako si to zapamätať

- `SelectKBest(známkovacia_funkcia, k=počet)` → `fit(X, y)` → `transform(X)`.
- `np.argsort(x)[::-1]` = indexy od najväčšej hodnoty po najmenšiu. Tento trik sa opakuje aj pri dôležitostiach lesa.
- Slabina: každý príznak sa hodnotí sám, kombinácie príznakov nevidí.
