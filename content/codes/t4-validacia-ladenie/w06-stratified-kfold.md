**O čo ide:** dáta majú 4 triedy a jedna z nich je vzácna (len 30 vzoriek). Pri obyčajnom delení by sa mohlo stať, že v niektorom folde táto trieda takmer chýba. **Stratifikovaný** K-fold delí tak, aby mal každý fold rovnaký pomer tried ako celok. Krížovú validáciu tu píšeme ručne cyklom.

### Krok za krokom

1. `np.load(...)` – načíta `X` a `y`.
2. `pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC(kernel='rbf', gamma=1, C=5))])` – škálovanie + SVM ako jeden model.
3. **Hold-out** (jedno rozdelenie):
    - `train_test_split(X, y, test_size=0.2, random_state=4)` – 20 % bokom,
    - `pipe_svc.fit(X_train, y_train)` – učenie,
    - `pipe_svc.score(X_test, y_test)` – presnosť na odložených dátach (`0.706`). Jedno číslo, závislé od náhody.
4. `skf = StratifiedKFold(n_splits=5)` – delenie na 5 foldov so zachovaním pomeru tried.
5. `for train, test in skf.split(X_train, y_train):` – na rozdiel od `KFold` potrebuje `split` aj **`y`**, inak by nevedel, aké sú triedy. Vydáva indexy.
6. V každom kole:
    - `pipe_svc.fit(X_train[train], y_train[train])` – učenie na štyroch foldoch,
    - `score = pipe_svc.score(X_train[test], y_train[test])` – presnosť na piatom, validačnom,
    - `scores.append(score)` – uložíme,
    - `ho_score = pipe_svc.score(X_test, y_test)` – ten istý model ešte vyskúšame na odloženom teste, len na porovnanie,
    - `np.bincount(y_train[train])` – koľko vzoriek má každá trieda; vo všetkých kolách takmer rovnako – to je tá stratifikácia.
7. `np.mean(scores)` a `np.std(scores)` – priemer a rozptyl piatich skóre: `0.658 +/- ...`. Priemer je spoľahlivejší odhad než jedno číslo z hold-outu.

### Ako si to zapamätať

- `KFold.split(X)` vs. `StratifiedKFold.split(X, y)` – stratifikovaný potrebuje triedy.
- Telo cyklu: `fit` na `[train]` → `score` na `[test]` → `append`.
- Výsledok krížovej validácie sa uvádza ako priemer ± odchýlka.
