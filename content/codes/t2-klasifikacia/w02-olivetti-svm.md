**O čo ide:** máme 400 fotiek tvárí 40 ľudí (10 fotiek na človeka). Naučíme model SVM spoznať, **kto** je na fotke, a zmeriame, ako často sa trafí.

Toto je základný recept celého strojového učenia v scikit-learn: **dáta → rozdelenie → model → `fit` → `predict` → presnosť**.

### Krok za krokom

1. `faces = fetch_olivetti_faces()` – načíta dataset. `faces.images` má tvar `(400, 64, 64)` (obrázky), `faces.data` tvar `(400, 4096)` (ten istý obrázok rozbalený do riadku, 64 × 64 = 4096 čísel), `faces.target` sú čísla osôb 0 až 39.
2. `print_faces(...)` – pomocná funkcia z cvičenia (`isi_utils`), iba nakreslí tváre. Na pochopenie nie je dôležitá.
3. `svc = SVC(kernel='linear')` – vytvorí model. Zatiaľ nič nevie. `kernel='linear'` znamená, že triedy oddeľuje rovnou hranicou.
4. `train_test_split(faces.data, faces.target, test_size=0.25, ...)` – rozdelí dáta: 75 % (300 fotiek) na učenie, 25 % (100 fotiek) na skúšanie. Vráti **štyri** veci v tomto poradí: `X_train, X_test, y_train, y_test`.
    - `random_state=0` – rozdelenie bude pri každom spustení rovnaké.
    - `stratify=faces.target` – z každého človeka pôjde do testu rovnaký podiel fotiek.
5. `svc.fit(X_train, y_train)` – **učenie**. Model vidí fotky aj správne odpovede.
6. `y_predict = svc.predict(X_test)` – **predikcia**. Model dostane len fotky, ktoré nikdy nevidel, a háda osoby.
7. `accuracy_score(y_test, y_predict)` – podiel správnych odpovedí. Vyjde `0.95` = 95 zo 100.
8. `np.where(y_test != y_predict)[0]` – pozície, kde sa model pomýlil (5 fotiek).

### Ako si to zapamätať

- Učí sa na `train`, skúša sa na `test`. Nikdy naopak a nikdy na tých istých dátach.
- `fit` dostane `X` aj `y`. `predict` dostane **len** `X`.
- `accuracy_score(pravda, predikcia)` – najprv skutočné hodnoty, potom predikované.
