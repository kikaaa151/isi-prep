**O čo ide:** vyvrcholenie Titanicu. Dáta sú vyčistené (vek doplnený, pohlavie a trieda zakódované), takže konečne môžeme naučiť model, ktorý predpovie, **či cestujúci prežil**.

Kód je dlhý, ale nové je len posledných šesť riadkov. Všetko pred nimi sú kroky z predchádzajúcich kódov poskladané za sebou.

### Krok za krokom

1. **Načítanie** – `read_csv`, `titanic_y` (stĺpec `survived` = odpoveď), `drop` nepotrebných stĺpcov.
2. **Chýbajúci vek** – päť riadkov s `ages`: doplní priemer.
3. **Pohlavie** – `LabelEncoder`: `female/male` → `0/1`.
4. **Trieda** – `LabelEncoder` na čísla a potom `OneHotEncoder` na tri stĺpce `class 1`, `class 2`, `class 3`.
5. `train_test_split(titanic_reduced, titanic_y, test_size=0.25, random_state=33)` – tabuľka príznakov a odpovede sa rozdelia na 75 % / 25 %.
6. `clf = tree.DecisionTreeClassifier(criterion='entropy', max_depth=5, min_samples_leaf=5)` – rozhodovací strom s tromi nastaveniami:
    - `criterion='entropy'` – podľa čoho strom vyberá otázky (entropia namiesto predvoleného `gini`),
    - `max_depth=5` – najviac 5 otázok za sebou,
    - `min_samples_leaf=5` – v každom koncovom liste musí ostať aspoň 5 cestujúcich.
    Obe obmedzenia bránia preučeniu.
7. `clf = clf.fit(X_train, y_train)` – učenie.
8. `y_pred_test = clf.predict(X_test)` – predikcia pre cestujúcich, ktorých strom nevidel.
9. `metrics.accuracy_score(y_test, y_pred_test)` – vyjde `0.78`: strom správne určí osud 78 % cestujúcich.

### Ako si to zapamätať

- Poradie blokov: **načítaj → doplň vek → zakóduj pohlavie → zakóduj triedu → rozdeľ → strom → `fit` → `predict` → presnosť**.
- Predspracovanie musí byť hotové **pred** `fit`, inak model spadne na textoch alebo `NaN`.
- Tu sa importuje celý modul: `from sklearn import tree`, `from sklearn import metrics` – preto `tree.DecisionTreeClassifier` a `metrics.accuracy_score`.
