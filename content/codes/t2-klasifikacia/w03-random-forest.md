**O čo ide:** ten istý recept ako pri strome, len model je **náhodný les** – veľa stromov, ktoré hlasujú. Je to najkratší úplný kód klasifikácie, oplatí sa vedieť ho naspamäť.

### Krok za krokom

1. `X, y = datasets.make_classification(1000, random_state=500)` – 1000 umelých vzoriek (predvolene 20 príznakov, 2 triedy).
2. `train_test_split(X, y, test_size=0.25, random_state=7)` – 750 na učenie, 250 na test.
3. `rf = RandomForestClassifier()` – les so 100 stromami (predvolená hodnota `n_estimators`). Každý strom sa učí na trochu iných dátach a príznakoch.
4. `rf.fit(X_train, y_train)` – naučia sa všetky stromy.
5. `y_predict = rf.predict(X_test)` – každý strom zahlasuje, vyhrá väčšina.
6. `accuracy_score(y_test, y_predict)` – podiel správnych, asi `0.98`.
7. `(y_test == y_predict).sum()` – **počet** správnych (nie podiel): `True` sa ráta ako 1, takže súčet je počet zhôd, asi `246` z 250.

### Ako si to zapamätať

- Štyri importy = štyri kroky: `datasets` (dáta), `train_test_split` (rozdelenie), `RandomForestClassifier` (model), `accuracy_score` (hodnotenie).
- `.mean()` z porovnania = podiel správnych, `.sum()` = počet správnych.
- Les nemá `random_state`, preto sa výsledok medzi spusteniami trochu mení.
