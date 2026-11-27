**O čo ide:** jedno rozdelenie na train/test je vec náhody – raz vyjde ľahký test, raz ťažký. K-fold preto dáta rozkrája na **K rovnakých dielov (foldov)** a postupne každý diel raz použije ako test. Tento kód ukazuje len samotné krájanie.

### Krok za krokom

1. `X, y = make_regression(N, random_state=5)` – 1000 umelých vzoriek. Je jedno aké, ide nám len o delenie.
2. `kfold = KFold(n_splits=10, shuffle=True, random_state=5)` – nastavenie delenia:
    - `n_splits=10` – desať dielov, teda desať kôl,
    - `shuffle=True` – vzorky sa pred delením zamiešajú (dôležité, ak sú dáta zoradené),
    - `random_state=5` – miešanie bude vždy rovnaké.
3. `kfold.split(X)` – v každom kole vydá **dve polia indexov**: `train` (čísla vzoriek na učenie) a `test` (čísla vzoriek na test). Nie samotné dáta – len ich poradové čísla.
4. `for i, (train, test) in enumerate(kfold.split(X)):` – `enumerate` pridá číslo kola `i` (0 až 9); dvojica v zátvorke sa rozbalí do `train` a `test`.
5. `len(train)`, `len(test)` – v každom kole 900 a 100: deväť dielov na učenie, jeden na test.
6. `test[:5]` – prvých päť testovacích indexov. V každom kole sú iné – každá vzorka je v teste **práve raz**.

### Ako si to zapamätať

- `KFold(...)` len popíše, ako deliť. Deliť začne až `.split(X)`.
- Dáta sa potom vyberú indexmi: `X[train]`, `y[train]`, `X[test]`, `y[test]`.
- Pri K foldoch: K kôl, v každom je (K − 1)/K dát na učenie a 1/K na test.
