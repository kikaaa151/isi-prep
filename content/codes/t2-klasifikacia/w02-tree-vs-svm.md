**O čo ide:** vyrobíme si umelé dáta a na **tom istom rozdelení** porovnáme dva modely – rozhodovací strom a lineárne SVM. Kto má vyššiu presnosť, vyhral.

### Krok za krokom

1. `datasets.make_classification(n_samples=1000, n_features=3, n_redundant=0, random_state=1)` – vygeneruje 1000 vzoriek s 3 príznakmi a dvoma triedami (0 a 1). `n_redundant=0` = žiadny príznak nie je len kópiou iných. Vráti rovno dvojicu `X, y`.
2. `train_test_split(X, y, test_size=0.25, random_state=0)` – 750 vzoriek na učenie, 250 na test.
3. `dtc = DecisionTreeClassifier()` – rozhodovací strom s predvolenými nastaveniami.
4. `dtc.fit(X_train, y_train)` – strom sa učí.
5. `y_predict = dtc.predict(X_test)` – strom háda triedy testovacích vzoriek.
6. `accuracy_score(y_test, y_predict)` – podiel správnych odpovedí, približne `0.84`.
7. `svc = SVC(kernel='linear')` a potom presne tie isté tri kroky: `fit`, `predict`, `accuracy_score`. Vyjde `0.88`.

### Ako si to zapamätať

- Všetky modely v scikit-learn sa používajú **rovnako**: vytvor → `fit` → `predict`. Mení sa len prvý riadok.
- Porovnanie je férové iba vtedy, keď oba modely dostanú rovnaké `X_train` a `X_test`.
- Strom nemá nastavený `random_state`, preto jeho číslo medzi spusteniami mierne skáče. SVM vyjde vždy rovnako.
