**O čo ide:** dáta sú už pripravené a rozdelené v súboroch `.npy`. Úloha: vyskúšať viac klasifikátorov a zistiť, ktorý má najvyššiu presnosť.

### Krok za krokom

1. `np.load('../data/X_train.npy')` – načíta pole NumPy uložené v súbore. Štyri súbory = štyri známe premenné `X_train`, `X_test`, `y_train`, `y_test`. Netreba `train_test_split`, rozdelenie už niekto urobil.
2. `classifiers = { ... }` – slovník: **kľúč** je meno (text na výpis), **hodnota** je pripravený model:
    - `DecisionTreeClassifier(random_state=0)` – jeden rozhodovací strom,
    - `RandomForestClassifier(random_state=0)` – les stromov,
    - `KNeighborsClassifier(n_neighbors=15)` – pozrie sa na 15 najbližších susedov a vyberie triedu, ktorá medzi nimi prevažuje,
    - `SVC(kernel='rbf')` – SVM so zakrivenou hranicou.
3. `for name, clf in classifiers.items():` – prejde slovník, v každom kole má meno aj model.
4. `clf.fit(X_train, y_train)` → `clf.predict(X_test)` → `accuracy_score(y_test, y_predict)` – rovnaké tri kroky pre každý model.
5. Výsledok: strom `0.70`, les `0.82`, KNN `0.85`, SVM `0.86`.

### Ako si to zapamätať

- Keďže každý model má `fit` a `predict`, dajú sa uložiť do slovníka a spracovať **jedným cyklom**.
- `.items()` dáva dvojice (kľúč, hodnota).
- Jeden strom je najslabší, les je lepší – viac stromov sa navzájom opraví.
