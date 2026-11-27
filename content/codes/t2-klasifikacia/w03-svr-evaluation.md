**O čo ide:** tentoraz nehádame triedu, ale **číslo** – cenu domu (regresia). Model je SVR (SVM pre regresiu). Presnosť (`accuracy`) sa pri číslach použiť nedá, preto hodnotíme pomocou R² a priemernej chyby.

### Krok za krokom

1. `fetch_openml(name="boston", version=1, as_frame=True)` – stiahne dataset cien domov v Bostone (506 domov, 13 príznakov).
2. `X = boston.data.astype(float).to_numpy()` a `y = boston.target.to_numpy(dtype=float)` – prevedie tabuľku na obyčajné polia desatinných čísel. `y` je cena domu.
3. `train_test_split(X, y, test_size=0.25, random_state=33)` – rozdelenie ako vždy.
4. **Škálovanie** – príznaky majú veľmi rozdielne rozsahy a SVM je na to citlivé:
    - `scaler = StandardScaler()` – nástroj, ktorý upraví každý príznak na priemer 0 a odchýlku 1,
    - `X_train = scaler.fit_transform(X_train)` – na trénovacích dátach si **zistí** priemer a odchýlku a hneď ich **použije**,
    - `X_test = scaler.transform(X_test)` – na teste už len **použije** čísla z tréningu. Žiadne `fit`!
5. `clf_svr = svm.SVR(kernel='linear')` a `clf_svr.fit(X_train, y_train)` – regresný model a jeho učenie.
6. `clf_svr.score(X_train, y_train)` – pri regresii `score` vracia R².
7. `y_pred = clf_svr.predict(X_test)` – predikované ceny pre testovacie domy.
8. `metrics.r2_score(y_test, y_pred)` – R² na teste (`0.651`). 1 = dokonalé, 0 = rovnako dobré ako tipovať stále priemer.
9. `metrics.mean_absolute_error(y_test, y_pred)` – o koľko sa model v priemere mýli (`3.413`, v tisícoch dolárov).

### Ako si to zapamätať

- Klasifikácia → `accuracy_score`. Regresia → `r2_score` a `mean_absolute_error`.
- Škálovanie: na tréningu `fit_transform`, na teste **len** `transform`. Inak by sa informácia z testu dostala do učenia.
- Metriky majú poradie (skutočné, predikované).
