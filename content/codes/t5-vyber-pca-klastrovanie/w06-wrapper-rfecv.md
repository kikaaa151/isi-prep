**O čo ide:** **obaľovacia (wrapper) metóda** – príznaky vyberá tak, že naozaj skúša model. Postup RFE: nauč model → vyhoď najmenej dôležitý príznak → nauč znova → vyhoď ďalší… `RFECV` k tomu pridá krížovú validáciu a sám zistí, **pri akom počte** príznakov je presnosť najvyššia.

### Krok za krokom

1. Načítanie `X`, `y` a mien príznakov – rovnaké dáta o srdci ako pri filtroch.
2. `clf = Pipeline([('scl', StandardScaler()), ('clf', SVC(C=1, kernel='linear'))])` – škálovanie + lineárne SVM.
    - Prečo lineárne? Má **váhy** (`coef_`) – jedno číslo na príznak. Veľká váha = dôležitý príznak.
    - Prečo škálovanie? Váhy sa dajú porovnávať, len keď majú príznaky rovnakú mierku.
3. `selector = RFECV(clf, step=1, cv=5, scoring='accuracy', importance_getter='named_steps.clf.coef_')`:
    - `step=1` – v každom kole vyhoď 1 príznak,
    - `cv=5` – každý počet príznakov ohodnoť 5-fold krížovou validáciou,
    - `scoring='accuracy'` – hodnoť presnosťou,
    - `importance_getter='named_steps.clf.coef_'` – cesta k váham: v pipeline choď do kroku s menom `clf` a zober `coef_`. Bez toho by `RFECV` nevedel, kde v pipeline dôležitosti hľadať.
4. `X_selected = selector.fit_transform(X, y)` – spustí celé vyhadzovanie a vráti dáta len s vybranými stĺpcami: z `(303, 13)` na `(303, 11)`.
5. `selector.n_features_` – koľko príznakov vyšlo ako najlepší počet (11).
6. `selector.support_` – maska vybraných; `feature_names[selector.support_]` sú ich mená.
7. `selector.ranking_` – poradie: `1` = vybraný, `2` = vyhodený ako posledný, `3` = predposledný…

### Ako si to zapamätať

- Wrapper = výber pomocou opakovaného učenia modelu → presnejší, ale pomalší než filter.
- RFE = Recursive Feature Elimination = postupné vyhadzovanie najslabšieho. CV na konci = s krížovou validáciou.
- Model vnútri musí vedieť povedať dôležitosť príznakov (`coef_` alebo `feature_importances_`).
