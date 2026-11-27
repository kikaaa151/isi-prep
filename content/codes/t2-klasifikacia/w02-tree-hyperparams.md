**O čo ide:** strom s predvolenými nastaveniami sa dáta „nabifľuje“ (preučí sa) a na teste dopadne slabo. Skúšame preto rôzne nastavenia (hyperparametre) a hľadáme tie, s ktorými je presnosť najvyššia.

### Krok za krokom

1. `make_classification(n_samples=750, n_features=200, n_informative=5, ...)` – 750 vzoriek, 200 príznakov, ale len **5** z nich naozaj niečo hovorí. Zvyšok je šum – ideálna pasca na preučenie.
2. `train_test_split(...)` – klasické rozdelenie 75 % / 25 %.
3. **Východisko:** `DecisionTreeClassifier(random_state=0)` → `fit` → `predict`. Presnosť sa tu počíta ručne: `(y_test == preds).mean()`. Porovnanie dá `True`/`False`, priemer z nich je podiel správnych. Vyjde asi `0.70`.
4. **Jeden parameter:** `for depth in range(1, 21):` – v cykle vytvoríme strom s `max_depth=depth` (hĺbka 1 až 20), naučíme ho a vypíšeme presnosť. Plytký strom (hĺbka 3) je lepší (`0.81`) než hlboký.
5. **Viac parametrov naraz:** `product(['gini', 'entropy'], range(1, 11), [1, 5, 10], [2, 10, 20])` – vyrobí **všetky kombinácie** hodnôt: 2 × 10 × 3 × 3 = 180 štvoríc.
6. V cykle sa štvorica rozbalí do `crit, depth, leaf, split` a vloží do stromu: `criterion`, `max_depth`, `min_samples_leaf`, `min_samples_split`.
7. `if acc > best_acc:` – ak je táto kombinácia lepšia než doteraz najlepšia, zapamätáme si jej presnosť aj parametre.
8. Na konci vypíšeme víťaza: `0.8085` pre `('gini', 3, 1, 2)`.

### Ako si to zapamätať

- Hyperparameter = nastavenie, ktoré zadávaš **ty** pred učením (model si ho nevie naučiť sám).
- Vzor „hľadanie najlepšieho“: `best = 0` → cyklus → `if acc > best:` ulož → na konci vypíš.
- `product(A, B, C)` = vnorené cykly napísané v jednom riadku.
- `max_depth` obmedzuje hĺbku stromu – menšia hĺbka = jednoduchší strom = menej preučenia.
