# Validácia a ladenie: K-fold, grid search, pipeline, metriky

Dve otázky tejto témy: **akú výkonnosť môžeme od modelu čakať na nových dátach** (hodnotenie, validácia) a **ako nájsť najlepšie nastavenie modelu** (výber modelu = ladenie hyper-parametrov).

## Pipeline

Pipeline je špecialita scikit-learn: **zoskupenie niekoľkých krokov** (predspracovanie + model) do jedného objektu, ktorý sa správa ako jeden model.

```python
pipe_lr = Pipeline([('scl', StandardScaler()),
                    ('clf', LogisticRegression(random_state=1))])
pipe_lr.fit(X_train, y_train)
y_pred = pipe_lr.predict(X_test)
```

- Zoznam dvojíc *(názov, objekt)*; **nie je obmedzená na dva kroky**.
- Kroky pred posledným sú transformátory (`fit` + `transform`), posledný krok je model.
- `pipe.fit(X_train, y_train)` – každý transformátor spraví `fit` a `transform` na trénovacích dátach, výsledok ide ďalej, posledný krok sa natrénuje.
- `pipe.predict(X_test)` / `pipe.score(X_test, y_test)` – transformátory robia už **iba** `transform` (s parametrami z trénovania), model predikuje.
- Parametre krokov sa adresujú ako `<názov kroku>__<parameter>` (dva podčiarkovníky), napr. `clf__C`.
- Pipeline sa dá vložiť do `cross_val_score`, `GridSearchCV`, `learning_curve` aj `validation_curve`.

> Na teste: prečo patrí scaler **do** pipeline? Krížová validácia trénuje celú pipeline v každom folde nanovo, takže priemer a odchýlku sa scaler učí iba z trénovacích foldov. Preškálovanie všetkých dát pred CV by do trénovania prenieslo informáciu z validačných foldov (únik informácie).

## Podtrénovanie a pretrénovanie

| | Podtrénovanie (underfitting) | Pretrénovanie (overfitting) |
|---|---|---|
| Iný názov | vysoká **odchýlka** (high bias) | vysoký **rozptyl** (high variance) |
| Príčina | príliš jednoduchý model | model príliš tesne naviazaný na trénovacie dáta (zachytáva aj šum) |
| Trénovacia presnosť | nízka | vysoká |
| Validačná presnosť | nízka | výrazne nižšia než trénovacia |
| Rozdiel trénovacia – validačná | malý | **veľký** |
| Čo pomôže | pridať atribúty, zložitejší model, slabšia regularizácia | viac dát, znížiť komplexitu modelu, odobrať atribúty, silnejšia regularizácia |

Cieľom je **kompromis medzi odchýlkou a rozptylom** – na to treba vhodnú evaluáciu modelu.

## Hold-out metóda

- Dáta sa raz rozdelia na **train** a **test**; model sa natrénuje na train a vyhodnotí na test.
- Zaužívaný, ale metodologicky nie úplne správny prístup: ak tie isté testovacie dáta opakovane používame na výber modelu (ladenie parametrov), **stávajú sa nepriamo súčasťou trénovania** → hrozí pretrénovanie a odhad výkonnosti je optimistický.
- Riešenie: pridať **validačné** dáta – **train / validation / test**. Na train sa trénuje, na validation sa vyberá nastavenie, test ostáva na jediné záverečné overenie.
- Nevýhoda: výsledok je **citlivý na to, ako sa dáta rozdelia** – iné rozdelenie dá iné číslo.

## Krížová validácia (cross-validation)

### K-fold

1. Trénovacie dáta sa rozdelia **bez vrátenia** (bez opakovania) na *k* častí – foldov.
2. *k*-krát: *k − 1* foldov na trénovanie, zvyšný jeden na vyhodnotenie.
3. Vznikne *k* modelov a *k* odhadov výkonnosti; výsledkom je ich **priemer** (± smerodajná odchýlka).

- Každá vzorka je práve raz vo validačnej časti a *k − 1*-krát v trénovacej.
- Odhad je menej závislý od jedného náhodného rozdelenia než hold-out.
- Slúži na **odhad výkonnosti na nových dátach** a na výber modelu; pomáha odhaliť a obmedziť pretrénovanie (model sa nevyberá podľa jedného „šťastného“ rozdelenia).
- Tradičná hodnota **k = 10**; pri veľkých dátových sadách **k = 5**.
- Väčšie *k* → viac dát na trénovanie v každom kole (vhodné pre menšie datasety), ale dlhšie trvanie.
- **Leave-one-out (LOOCV)**: špeciálny prípad **k = N** (počet vzoriek) – testuje sa vždy na jedinej vzorke, trénuje sa N modelov; vhodné pre veľmi malé datasety, výpočtovo najdrahšie.

### Stratifikovaná K-fold

Vylepšenie: foldy sa vzorkujú tak, aby **zastúpenie tried v každom folde zodpovedalo ich zastúpeniu v celej dátovej sade**. Dôležité pri **nevyvážených triedach** – bez stratifikácie môže vzácna trieda v niektorom folde chýbať úplne (cvičenie 6: trieda 0 má len 30 vzoriek zo 6083).

### V scikit-learn

```python
kfold = KFold(n_splits=10, shuffle=True, random_state=5)
for i, (train, test) in enumerate(kfold.split(X)):
    ...                                   # train, test su polia indexov

skf = StratifiedKFold(n_splits=5)
for train, test in skf.split(X_train, y_train):
    pipe_svc.fit(X_train[train], y_train[train])
    score = pipe_svc.score(X_train[test], y_train[test])

scores = cross_val_score(pipe_svc, X_train, y_train, cv=5)
print('%.3f +/- %.3f' % (np.mean(scores), np.std(scores)))
```

| Objekt / funkcia | Čo treba vedieť |
|---|---|
| `KFold(n_splits, shuffle, random_state)` | `split(X)` vracia **indexy** `(train, test)`; bez `shuffle` sú foldy súvislé bloky |
| `StratifiedKFold(n_splits)` | `split(X, y)` – potrebuje aj `y`, aby zachoval pomer tried |
| `cross_val_score(model, X, y, cv=5)` | spraví celý cyklus, vráti pole *k* skóre; model trénuje sám (na kópiách) |
| `cv=5` pri klasifikátore | použije sa `StratifiedKFold(n_splits=5)` |
| `cv=5` pri regresore | použije sa `KFold(n_splits=5)` |
| predvolené skóre | klasifikátor: **accuracy**, regresor: **R²** |
| `n_jobs=-1` | výpočet na všetkých jadrách |

- `shuffle=True` premieša vzorky pred delením – dôležité, keď sú dáta zoradené (napr. podľa triedy).
- `random_state` má zmysel iba spolu so `shuffle=True` (novšie verzie scikit-learn inak vyhodia chybu).
- Pri 1000 vzorkách a `n_splits=10`: 900 trénovacích a 100 testovacích v každom folde.

### Bootstrap validácia

Prevzorkovacia technika, ktorá opakovane odoberá náhodné vzorky **s vrátením** z pôvodnej množiny.

1. Z trénovacej množiny sa vytvorí viacero bootstrap vzoriek – každá má **rovnakú veľkosť** ako pôvodná množina, niektoré záznamy sa v nej opakujú.
2. Model sa natrénuje na bootstrap vzorke a otestuje na záznamoch, ktoré vo vzorke **neboli** (out-of-bag dáta).
3. Opakuje sa *n*-krát (zvyčajne 1000× a viac) → odhad variácie výkonu modelu.

S vrátením = tú istú „loptičku“ môžeme vybrať viackrát (A, B, A); bez vrátenia = každú iba raz (A, B, C). K-fold je validácia **bez vrátenia**.

### Časové rady

Pri predikcii časových radov sa dáta nemiešajú: trénuje sa na **minulosti** a testuje na dátach, ktoré v čase **nasledujú** po trénovacích.

## Krivka učenia a validačná krivka

| | Krivka učenia (learning curve) | Validačná krivka (validation curve) |
|---|---|---|
| Os x | **počet trénovacích vzoriek** | **hodnota hyper-parametra** (napr. `C`) |
| Os y | trénovacia a validačná presnosť | trénovacia a validačná presnosť |
| Odpovedá na | pomôže viac dát? má model vysokú odchýlku alebo rozptyl? | ako výkon závisí od hyper-parametra, kde model podtrénuje a kde pretrénuje |
| scikit-learn | `learning_curve(estimator, X, y, train_sizes=..., cv=10)` | `validation_curve(estimator, X, y, param_name='clf__C', param_range=..., cv=10)` |

Čítanie krivky učenia:

- **Vysoká odchýlka (podtrénovanie)**: trénovacia aj validačná presnosť sú nízke a blízko seba → viac dát nepomôže; pridať atribúty, zložitejší model.
- **Vysoký rozptyl (pretrénovanie)**: trénovacia presnosť vysoká, validačná výrazne nižšia (veľká medzera) → viac dát, znížiť komplexitu modelu, odobrať atribúty.
- Získať viac dát je drahé a nie vždy pomôže.

Obe funkcie vnútri používajú (stratifikovanú) k-násobnú krížovú validáciu a vracajú skóre pre každý fold; kreslí sa **priemer** (čiara) a **smerodajná odchýlka** (pás okolo čiary).

```python
train_sizes, train_scores, test_scores = learning_curve(
    estimator=pipe_lr, X=X, y=y, train_sizes=np.linspace(0.1, 1.0, 10), cv=10)
train_scores, test_scores = validation_curve(
    estimator=pipe_lr, X=X, y=y, param_name='clf__C', param_range=param_range, cv=10)
train_mean = np.mean(train_scores, axis=1)     # priemer cez foldy
```

Príklad z prednášky (logistická regresia, parameter `C`): pri malom `C` (silná regularizácia) model podtrénuje, pri veľkom `C` trénovacia presnosť ďalej rastie, ale validačná klesá – mierne pretrénovanie.

## Ladenie hyper-parametrov

Rozlišujeme dva typy parametrov:

| | Parametre modelu | Hyper-parametre |
|---|---|---|
| Odkiaľ sú | **naučené z dát** pri trénovaní | **nastaviteľné** – volíme ich my, optimalizujú sa separátne |
| Príklady | váhy logistickej regresie, prahy v uzloch stromu | `C`, `gamma`, `kernel`, `max_depth`, `criterion`, `max_features`, počet susedov *k* |

Cieľ ladenia: **optimalizovať výkon modelu**. Nástroje: validačná krivka (jeden parameter) a **grid search**.

### Grid search

- **Brute-force** prístup: vyskúša **každú kombináciu** zvolených hodnôt a ponechá tú s najlepším skóre.
- Počet kombinácií = súčin počtov hodnôt jednotlivých parametrov; pri CV sa násobí počtom foldov.

Ručne (cvičenie 5):

```python
criteria = ['gini', 'entropy']
max_features = ['sqrt', 5, None]
for criterion, max_feature in it.product(criteria, max_features):   # 2 x 3 = 6 kombinacii
    dt = DecisionTreeClassifier(criterion=criterion, max_features=max_feature)
    dt.fit(X_train, y_train)
    accuracies[(criterion, max_feature)] = accuracy_score(y_test, dt.predict(X_test))
```

> Pozor: najlepšia kombinácia podľa **jedného** rozdelenia sa pri inom rozdelení mení – jediný split na výber hyper-parametrov nestačí. Preto sa každá kombinácia hodnotí krížovou validáciou, a to **iba na trénovacej množine**.

### GridSearchCV

Spraví všetko naraz: prejde mriežku, každú kombináciu vyhodnotí krížovou validáciou a víťaza **pretrénuje na všetkých dátach**, ktoré dostal vo `fit`.

```python
param_grid = {'l1_ratio': [0, 1],
              'C': [0.001, 0.01, 0.1, 1, 10, 100]}
gs = GridSearchCV(lr, param_grid, cv=5)
gs.fit(X, y)
print(gs.best_params_, gs.best_score_)
```

| Atribút / metóda | Význam |
|---|---|
| `best_params_` | slovník najlepšej kombinácie |
| `best_score_` | **priemerné CV skóre** najlepšej kombinácie (nie testovacie skóre) |
| `best_estimator_` | víťazný model pretrénovaný na celých dátach z `fit` |
| `cv_results_` | slovník polí: `'params'`, `'mean_test_score'`, `'std_test_score'`, `'rank_test_score'`, … (dá sa previesť na `pd.DataFrame`) |
| `gs.score(X_test, y_test)`, `gs.predict(...)` | použijú `best_estimator_` |

Počítanie: mriežka vyššie má 2 × 6 = **12 kombinácií**, pri `cv=5` je to **60 trénovaní** + 1 záverečné pretrénovanie.

Logistická regresia z cvičenia: `C` je **prevrátená hodnota sily regularizácie** (malé `C` = silná regularizácia); `l1_ratio` = typ regularizácie (0 → L2, 1 → L1); `solver='liblinear'` podporuje obe.

### Grid search nad pipeline (cvičenie 6)

```python
pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC())])
param_range = [0.001, 0.01, 0.1, 1, 10, 100]
param_grid = [{'clf__kernel': ['linear'], 'clf__C': param_range},
              {'clf__kernel': ['rbf'], 'clf__C': param_range, 'clf__gamma': param_range},
              {'clf__kernel': ['poly'], 'clf__C': param_range, 'clf__gamma': param_range,
               'clf__degree': [1, 2, 3]}]
gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=5, n_jobs=-1)
gs = gs.fit(X_train, y_train)
print(gs.best_score_, gs.best_params_, gs.score(X_test, y_test))
```

- **Zoznam slovníkov** = každý slovník sa prehľadáva zvlášť. `gamma` je pri lineárnom kerneli zbytočná, `degree` používa iba polynomiálny.
- Počet kombinácií: linear 6 + rbf 6 × 6 = 36 + poly 6 × 6 × 3 = 108 → **150 kombinácií × 5 foldov = 750 trénovaní** (+ 1 pretrénovanie). Jedna spoločná mriežka by mala 3 × 6 × 6 × 3 = 324 kombinácií, väčšinou nezmyselných.
- SVC: `C` = pokuta za nesprávnu klasifikáciu, `gamma` = šírka RBF „kopčekov“; veľká `gamma` = veľmi lokálny model → pretrénovanie.
- Bez škálovania dosiahol ten istý SVC na cvičení CV presnosť ≈ 0.54 namiesto 0.85 – atribúty mali veľmi rozdielne mierky.
- Správny postup: najprv odložiť testovaciu množinu, `GridSearchCV` spustiť iba na trénovacej, test použiť raz na konci.

### Vnorená krížová validácia

**Krížová validácia + ladenie parametrov prehľadávaním mriežky = vnorená krížová validácia.**

- **Vonkajšia** slučka delí dáta na trénovacie a testovacie foldy a odhaduje výkonnosť.
- **Vnútorná** slučka (grid search) na trénovacom folde vyberá hyper-parametre.
- Odhad výkonnosti tak nie je skreslený tým, že sa na tých istých dátach ladilo.

```python
gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=2)
scores = cross_val_score(gs, X, y, scoring='accuracy', cv=5)     # 5 x 2 vnorena CV
```

## Metriky výkonnosti

### Matica zámien (confusion matrix)

| | Predikovaná negatívna | Predikovaná pozitívna |
|---|---|---|
| **Skutočná negatívna** | TN (true negative) | FP (false positive) |
| **Skutočná pozitívna** | FN (false negative) | TP (true positive) |

`confusion_matrix(y_true, y_pred)` – riadky = skutočné triedy, stĺpce = predikované; pre binárnu úlohu `[[TN, FP], [FN, TP]]`.

| Metrika | Vzorec | Čo hovorí |
|---|---|---|
| Presnosť (accuracy, ACC) | `(TP + TN) / (TP + TN + FP + FN)` | celkový podiel správnych predikcií |
| Chyba (error, ERR) | `(FP + FN) / (TP + TN + FP + FN) = 1 − ACC` | podiel nesprávnych predikcií |
| Precision (PRE) | `TP / (TP + FP)` | koľko z **predikovaných pozitívnych** je naozaj pozitívnych |
| Recall = TPR (pomer správnych pozitívnych) | `TP / (TP + FN)` | koľko zo **skutočných pozitívnych** model našiel |
| FPR (pomer nesprávnych pozitívnych) | `FP / (FP + TN)` | koľko zo skutočných negatívnych označil za pozitívne |
| F1-skóre | `2 · PRE · REC / (PRE + REC)` | harmonický priemer precision a recall |

```python
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
confmat = confusion_matrix(y_true, y_pred)
```

- Pri **nevyvážených triedach** je accuracy zavádzajúca: model, ktorý pri 95 % negatívnych vzoriek vždy povie „negatívna“, má accuracy 0.95, ale recall 0. Vhodnejšie sú TPR, FPR, precision, recall a F1.
- Príklad: `[[4, 2], [1, 3]]` → TN = 4, FP = 2, FN = 1, TP = 3; ACC = 7/10 = 0.7, PRE = 3/5 = 0.6, REC = 3/4 = 0.75, F1 ≈ 0.667.

### ROC krivka

- **Receiver operator characteristic** – závislosť **TPR** (os y) od **FPR** (os x) pri posúvaní rozhodovacieho prahu klasifikátora.
- Diagonála = náhodné hádanie; dokonalý klasifikátor je v ľavom hornom rohu (TPR = 1, FPR = 0).
- Zhrnutie jedným číslom: plocha pod krivkou (AUC) – 1 = dokonalý, 0.5 = náhodný.

### Regresné úlohy

- **MSE** – priemer štvorcov chýb; menšie je lepšie.
- **R²** (koeficient determinácie) – 1 = dokonalá predikcia; predvolené skóre regresorov v `score` aj v `cross_val_score`.

## Typické pasce

- `best_score_` je priemer z validačných foldov, nie presnosť na testovacích dátach.
- `KFold.split` vracia indexy, nie dáta; `StratifiedKFold.split` potrebuje aj `y`.
- Krivka učenia má na osi x **veľkosť trénovacej množiny**, validačná krivka **hodnotu hyper-parametra**.
- Podtrénovanie = vysoká odchýlka (bias); pretrénovanie = vysoký rozptyl (variance) – nie naopak.
- LOOCV je k-fold s k = N, nie samostatná metóda; bootstrap vzorkuje **s** vrátením, k-fold **bez**.
- V pipeline sa parameter volá `clf__C` (dva podčiarkovníky), nie `C` ani `clf_C`.
- Škálovanie pred krížovou validáciou mimo pipeline = únik informácie.
- Ladenie podľa testovacej množiny = testovacie dáta sa stali súčasťou trénovania.
- Precision delí počtom **predikovaných** pozitívnych, recall počtom **skutočných** pozitívnych.

## Rýchle zhrnutie

- Pipeline = reťaz krokov (transformátory + model) ako jeden objekt; parametre `krok__parameter`; chráni pred únikom informácie pri CV.
- Podtrénovanie: príliš jednoduchý model, vysoká odchýlka; pretrénovanie: model naviazaný na trénovacie dáta (šum), vysoký rozptyl, veľký rozdiel medzi trénovacou a validačnou presnosťou.
- Hold-out: jedno rozdelenie; ladenie na teste je chyba → train / validation / test; citlivé na rozdelenie.
- K-fold: k častí bez vrátenia, k − 1 na trénovanie, 1 na test, k opakovaní, priemer; k = 10 tradične, k = 5 pre veľké dáta.
- LOOCV: k = N; stratifikovaná K-fold: zachová pomer tried v každom folde (nevyvážené triedy).
- `cross_val_score(model, X, y, cv=5)` vráti pole skóre; klasifikátor → stratifikovaná K-fold a accuracy, regresor → K-fold a R².
- Bootstrap: vzorky s vrátením rovnakej veľkosti, test na out-of-bag dátach, veľa opakovaní.
- Krivka učenia: presnosť vs. počet trénovacích vzoriek; validačná krivka: presnosť vs. hodnota hyper-parametra.
- Parametre sa učia z dát, hyper-parametre nastavujeme; grid search = brute-force cez všetky kombinácie.
- `GridSearchCV(model, param_grid, cv=5)`: `best_params_`, `best_score_`, `best_estimator_`, `cv_results_`; počet trénovaní = kombinácie × foldy (+ 1).
- Zoznam slovníkov v `param_grid` = samostatné mriežky (napr. pre každý kernel).
- Vnorená CV = vonkajšia slučka odhaduje výkonnosť, vnútorná ladí hyper-parametre.
- Matica zámien: TP, FP, FN, TN; accuracy = (TP + TN) / všetky; precision = TP / (TP + FP); recall = TP / (TP + FN); F1 = harmonický priemer.
- Pri nevyvážených triedach nestačí accuracy; ROC = TPR vs. FPR, diagonála = náhodné hádanie.
