# Klasifikácia: SVM, rozhodovacie stromy, náhodné lesy, KNN

## Učenie s učiteľom a klasifikácia

- **Učenie s učiteľom**: model sa učí z príkladov **so správnymi odpoveďami** (labelmi). „Učiteľ" = labely `y`.
- Reťazec: dáta `(x, y)` → algoritmus `fit(X, y)` → model `f(x) ≈ y` → predikcia pre nový `x`.
- **Skutočný cieľ** nie je zapamätať si trénovacie dáta, ale fungovať na nových, nevidených dátach (**generalizácia**).
- Všetky modely tejto témy – perceptrón, SVM, rozhodovacie stromy, **náhodné lesy**, KNN – sú metódy **učenia
  s učiteľom**. K-means, PCA a iné klastrovacie či redukčné metódy sú učenie bez učiteľa.
- **Klasifikácia = hľadanie rozhodovacej hranice.** Každá vzorka je bod v priestore atribútov; klasifikátor rozdelí
  priestor na oblasti (rozhodovacie regióny), každá patrí jednej triede. Nový bod dostane triedu podľa toho, do
  ktorej oblasti padne.
- Rôzne algoritmy → rôzne tvary hraníc: priamka (lineárny SVM, perceptrón), „schodíky" rovnobežné s osami
  (rozhodovací strom), krivka (SVM s RBF jadrom, KNN).

## Perceptrón

- **Najjednoduchšia neurónová sieť**, **lineárny klasifikátor**, **učenie s učiteľom**.
- Vypočíta **váhovanú kombináciu vstupov** `z = w1·x1 + … + wn·xn` a výsledok **porovná s rozhodovacou úrovňou**
  (prahom θ). Prah sa presúva do váh ako **bias** (`w0 = −θ`, `x0 = 1`).
- **Aktivačná funkcia = jednotkový skok** (step): `φ(z) = 1`, ak `z ≥ θ`, inak `−1`.
- **Učiace pravidlo perceptrónu** (ako získať `w`): pre každú trénovaciu vzorku
  `w := w + Δw`, `Δw = η · (y − ŷ) · x`, kde `η` je rýchlosť učenia, `y` skutočná a `ŷ` predikovaná trieda.
  Pri správnej predikcii sa váhy nemenia.
- **Konvergencia**: zaručená **iba ak sú triedy lineárne separovateľné** (a η je dostatočne malé). Na lineárne
  neseparovateľných dátach perceptrón **nekonverguje** – váhy sa menia donekonečna, preto sa obmedzuje počet epoch.
- Perceptrón **minimalizuje chybu nesprávneho zaradenia** (misclassification error).

| Fáza | Poznáme | Nepoznáme → počítame |
|---|---|---|
| **Trénovanie** | `x_train`, `y_train` | váhy `w` |
| **Testovanie** | `x_test`, váhy `w` | `y_test` (triedu testovacích vzoriek) |

```python
from sklearn.linear_model import Perceptron
ppn = Perceptron(n_iter=40, eta0=0.1, random_state=0)   # v nových verziach max_iter=40
ppn.fit(X_train, y_train)
y_pred = ppn.predict(X_test)
print('Misclassified samples: %d' % (y_test != y_pred).sum())
```

## SVM – metóda podporných vektorov

- „Rozšírenie perceptrónu": perceptrón minimalizuje chybu zaradenia, **SVM maximalizuje hraničné pásmo (margin)**.
- **Margin** = vzdialenosť medzi oddeľujúcimi hranicami (rovinami) prechádzajúcimi najbližšími vzorkami oboch
  tried. Tieto najbližšie vzorky sú **podporné vektory** (support vectors) – iba ony určujú hranicu.
- Margin je `2 / ‖w‖` → maximalizovať margin = **minimalizovať `½ ‖w‖²`**; v praxi sa rieši **kvadratickým
  programovaním**.
- Širší margin → lepšia generalizácia; úzky margin → náchylnosť na pretrénovanie.

### Slack (voľný) parameter a C

- Otázka z prednášky: čo ak sa dáta **nedajú oddeliť** rovinou? Odpoveď: **slack („voľná") premenná** ξ
  (Vapnik, 1995) – dovolí niektorým vzorkám porušiť margin alebo byť zle zaradené (soft margin).
- Minimalizuje sa `½ ‖w‖² + C · Σ ξ`. Hyperparameter **C** (regularizačný parameter) **nastavuje kompromis medzi
  šírkou hranice a nesprávnym zaradením**:

| | veľké C | malé C |
|---|---|---|
| Trest za chybu | veľký | malý |
| Margin | užší | širší |
| Riziko | **pretrénovanie** (overfitting) | podtrénovanie (underfitting) |

### Kernelizácia

- Lineárne neseparovateľné dáta (typicky **XOR**) nevyrieši žiadna priamka. Riešenia: **kernelizácia** alebo
  (neskôr) umelé neurónové siete (univerzálny aproximátor funkcie).
- **Kernelizácia** = pomocou mapovacej funkcie sa dáta **premietnu do viacrozmerného priestoru**, kde už sú
  lineárne separovateľné; späť v pôvodnom priestore vyzerá hranica nelineárne. Umožňuje riešiť **nelineárnu
  klasifikáciu**.
- Najpoužívanejšie jadro: **RBF** (radial basis function), `k(x, x') = exp(−γ · ‖x − x'‖²)`. Parameter **gamma**:
  väčšia γ → menší dosah jednej vzorky → **tesnejšie, členitejšie rozhodovacie regióny** → pretrénovanie.
- Ďalšie jadrá v scikit-learn: `'linear'`, `'poly'` (polynomiálne, predvolený stupeň 3), `'rbf'` (predvolené).

**Hyperparametre SVM**: slack / regularizačný parameter `C`, typ jadra `kernel`, parameter jadra `gamma`.

```python
from sklearn.svm import SVC
svm = SVC(kernel='linear', C=1, random_state=0)             # lineárny SVM (Iris)
svm = SVC(kernel='rbf', random_state=0, gamma=2, C=0.10)    # XOR dáta
svm = SVC(kernel='rbf', random_state=0, gamma=2, C=10)      # Iris; gamma=200 → pretrénovanie
```

- Iris s γ = 200: presnosť na tréningu 0.99, na teste 0.76 – zmena parametra (zvýšenie gamma) zmení rozhodovacie
  regióny.
- SVM pracuje so vzdialenosťami → príznaky treba **štandardizovať** (`StandardScaler`).
- Z cvičenia: + dobrý pri veľa atribútoch (tváre: 4096 príznakov), − menej intuitívny.
- `LinearSVC` – iná implementácia lineárneho SVM; `SVR` – SVM pre regresiu.

## Rozhodovacie stromy

- Modelujú rozhodnutia a ich následky vo forme **stromovej štruktúry**:
  - **vnútorný uzol** = rozhodnutie na základe určitej vlastnosti (feature), napr. „je x3 > 2,5?",
  - **vetva** = výsledok rozhodnutia,
  - **listový uzol** = konečná **trieda** (klasifikácia) alebo **číselná hodnota** (regresia).
- Začiatok = **koreň** (root). Dobrá otázka vo vetve = prináša veľa nových informácií.

### Tvorba stromu

1. **Výber najlepšej vlastnosti a bodu rozdelenia** – ten, ktorý dáva **najvyšší informačný zisk** (kritériá:
   **Giniho index** alebo **entropia** pre klasifikáciu, **redukcia rozptylu** pre regresiu).
2. **Vytvorenie rozhodovacích uzlov** a vetiev.
3. **Rozdelenie dát** do podskupín podľa podmienok v uzloch.
4. **Rekurzívne opakovanie** pre každú podskupinu, kým nie je splnená zastavovacia podmienka (napr. **maximálna
   hĺbka** stromu alebo **minimálny počet vzoriek v uzle**).
5. **Priradenie tried alebo hodnôt** listovým uzlom.

### Miery nečistoty a informačný zisk

- **Entropia**: `H = − Σ p_i · log2(p_i)`. Uzol s jednou triedou: H = 0; dve triedy 50 : 50: H = 1.
  **Vysoká entropia = dáta distribuované vo viacerých triedach.**
- **Gini**: `G = 1 − Σ p_i²`. Čistý uzol: 0; 50 : 50: 0.5.
- **Informačný zisk** (information gain): `IG = nečistota(rodič) − Σ (N_j / N) · nečistota(potomok_j)`.
  Používa sa na **rozhodnutie, podľa ktorého atribútu sa uzol rozdelí** – vyberie sa rozdelenie s najväčším IG.

### Vlastnosti

| Pozitíva | Negatíva |
|---|---|
| interpretovateľnosť, vizualizácia | **náchylné na pretrénovanie** |
| dobre zvládajú zmiešané numerické a kategorické atribúty | **citlivosť na malé zmeny v dátach** |
| **nevyžadujú normalizáciu ani štandardizáciu** | hranice len rovnobežné s osami |

- Pretrénovanie sa krotí **orezávaním (pruning)** – obmedzením zložitosti: `max_depth`, `min_samples_leaf`,
  `min_samples_split`. Neobmedzený strom rastie, kým nie sú listy čisté → 100 % na tréningu, slabšie na teste.

```python
from sklearn.tree import DecisionTreeClassifier
tree = DecisionTreeClassifier(criterion='entropy', max_depth=3, random_state=0)
tree.fit(X_train, y_train)

from sklearn.tree import export_graphviz        # export štruktúry stromu
export_graphviz(tree, out_file='tree.dot', feature_names=['petal length', 'petal width'])
```

- `criterion`: `'gini'` (predvolené), `'entropy'`, `'log_loss'`.

## Náhodné lesy (Random Forest)

- Algoritmus z kategórie **ensemble learning** (skupinový klasifikátor): **kombinuje predikcie viacerých
  rozhodovacích stromov** („slabších" klasifikátorov) s cieľom zlepšiť presnosť a stabilitu.
- Používa sa na **klasifikačné aj regresné** úlohy.
- Využíva **bagging** (bootstrap aggregating) a **náhodný výber vlastností** → znižuje riziko preučenia a zvyšuje
  robustnosť. Obmedzuje hlavnú slabinu stromov – pretrénovanie.

**Algoritmus:**

1. Vyber podmnožinu trénovacích dát **s opakovaním** (with replacement) – **bootstrap** vzorka.
2. Natrénuj rozhodovací strom na bootstrap vzorke, pričom sa vyberá aj **podmnožina atribútov bez opakovania**
   (without replacement).
3. Opakuj kroky 1 a 2 **N-krát** (N = počet stromov).
4. **Agreguj** výsledky stromov – **majority voting** (väčšinové hlasovanie); pri regresii priemer.

| Pozitíva | Negatíva |
|---|---|
| **odolnosť voči pretrénovaniu** – náhodný výber vlastností a bootstrap znižujú závislosť modelov | **vyššia výpočtová náročnosť** – tréning viacerých stromov je pamäťovo a časovo náročnejší |
| **robustnosť voči šumu** – ignoruje anomálie a šum | **zložitejšia interpretácia** |
| **vysoká presnosť a stabilita** | **strata interpretovateľnosti** s rastom zložitosti |
| **podpora pre chýbajúce hodnoty** | |

```python
from sklearn.ensemble import RandomForestClassifier
forest = RandomForestClassifier(criterion='entropy', n_estimators=10, random_state=1, n_jobs=2)
```

- `n_estimators` = počet stromov (predvolene 100), `n_jobs` = počet jadier procesora, `random_state` = opakovateľnosť.
- `rf.predict_proba(X_test)` – pre každú vzorku **podiel stromov hlasujúcich za jednotlivé triedy** (tvar
  `(počet vzoriek, počet tried)`, riadok dáva súčet 1). Z cvičenia: les je presný, keď sa stromy zhodnú
  (pravdepodobnosť blízko 0 alebo 1), a nespoľahlivý, keď je hlasovanie blízko 0.5.

## K najbližších susedov (KNN)

- **Lenivý (lazy) prístup**: nesnaží sa naučiť funkciu rozdeľujúcu dáta, ale **pamätá si dáta samotné**
  (instance-based learning). „Trénovanie" = uloženie dát; práca sa robí až pri predikcii.
- **Nenapovedá prečo** (žiadny interpretovateľný model). Určený na **klasifikačné aj regresné** úlohy.
- **K = počet najbližších susedov**, ktorí rozhodujú.

**Algoritmus:**

1. Vyber hodnotu **k** a **mieru vzdialenosti** (euklidovská, manhattan, minkowski …).
2. Nájdi **k najbližších susedov** spracúvanej vzorky.
3. Priraď triedu **majoritným rozhodnutím** (väčšina medzi susedmi).

```python
from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier(n_neighbors=5, p=2, metric='minkowski')   # p=2 → euklidovská, p=1 → manhattan
```

- **Voľba k** = rovnováha medzi pretrénovaním a podtrénovaním: **príliš nízke k → preučenie** (overfitting),
  **príliš vysoké k → podučenie** (underfitting). Väčšie k = väčšia výpočtová náročnosť.
- **Premenné sú rovnako dôležité** (na rozdiel od stromov) → príznaky treba škálovať a irelevantné škodia.
- Negatíva: **vyššia výpočtová náročnosť** (výpočet vzdialeností pri veľkých datasetoch), **citlivosť na šum
  a irelevantné vlastnosti**, **náročnosť na pamäť** (uchováva celý dataset), **citlivosť na hodnotu k**,
  citlivosť na **kliatbu veľkých rozmerov**.

## Kliatba dimenzionality (curse of dimensionality)

Dáta majú vysokú dimenzionalitu = vysoký počet príznakov, zvyčajne **N_features >> N_samples**. Dôsledky:

- zvýšené nároky na úložný priestor,
- zvýšená výpočtová náročnosť klasifikátora,
- výrazne horšia interpretovateľnosť,
- **pretrénovanie klasifikátorov** (najmä KNN),
- **narastá vzdialenosť medzi dátovými bodmi** (priestor je riedky, „najbližší" sused je ďaleko).

## Porovnanie klasifikátorov

| | Perceptrón | SVM | Rozhodovací strom | Náhodný les | KNN |
|---|---|---|---|---|---|
| Princíp | váhovaný súčet + skok | maximálny margin | séria otázok | hlasovanie stromov | hlasovanie susedov |
| Hranica | priamka | priamka / krivka (kernel) | schodíky | zložené schodíky | ľubovoľná |
| Nelineárne dáta | nie | áno (kernel) | áno | áno | áno |
| Potrebuje škálovanie | áno | áno | **nie** | **nie** | áno |
| Interpretovateľnosť | stredná | nízka | **vysoká** | nízka | nízka („nenapovedá prečo") |
| Hlavný hyperparameter | `eta0`, počet epoch | `kernel`, `C`, `gamma` | `max_depth` | `n_estimators` | `n_neighbors` |
| Hlavná slabina | len lineárne separovateľné dáta | menej intuitívny | pretrénovanie | výpočtová náročnosť | pomalý pri veľkých dátach |

Všetky majú v scikit-learn rovnaké rozhranie: `model.fit(X_train, y_train)` → `model.predict(X_test)`.

## State of the art a No free lunch

- **XGBoost** – algoritmus založený na **boostingu**: kombinuje viacero slabých modelov (rozhodovacích stromov) do
  silného modelu. Stromy vytvára **iteratívne – každý nový strom koriguje chyby predchádzajúcich**.
  (Random Forest = bagging: stromy nezávisle, paralelne.)
- **TabNet** – využíva **mechanizmus pozornosti (attention)**, aby sa zameral na relevantné vlastnosti.
- Na tabuľkových dátach **modely založené na stromoch (gradient-boosted ensembles) stále väčšinou prekonávajú
  hlboké učenie**.
- **No free lunch theorem**: model je založený na zjednodušení reality, zjednodušenie na predpokladoch a
  **predpoklady neplatia vždy a všade** → neexistuje jeden model najlepší pre všetky úlohy; treba ich porovnávať.

## Hodnotenie modelov

- **Generalizácia** = schopnosť modelu robiť správne predikcie na nevidených dátach. Hodnotiť model na dátach, na
  ktorých sa učil, je ako dať študentovi na skúške tie isté otázky – výsledok je **príliš optimistický**.
- **Trénovacia / testovacia množina** (napr. 75 % / 25 %): z trénovacej sa model učí, testovacia je len na finálne
  vyhodnotenie. Dáta sa pred rozdelením **zamiešajú**; pri nevyvážených triedach sa delí **stratifikovane**
  (`stratify=y` – zachová pomer tried).
- **Zlaté pravidlo**: testovacia množina sa nesmie použiť pri učení ani pri ladení modelu, inak nastáva **únik
  informácie (data leakage)** a odhad je skreslený.

| Množina | Na čo slúži | Otázka |
|---|---|---|
| **trénovacia** (napr. 60 %) | model sa učí – nastavuje parametre | „Čo sa model naučil?" |
| **validačná** (20 %) | výber najlepšieho modelu a nastavení (hyperparametrov) | „Ktorý model zvoliť?" |
| **testovacia** (20 %) | použije sa **raz, na konci** – nezávislý odhad kvality | „Ako dobre bude fungovať?" |

Ak model vyberáme podľa výsledku na teste, test sa stáva súčasťou učenia a jeho výsledok je príliš optimistický.

### Matica zámen a metriky

| | predikcia 0 | predikcia 1 |
|---|---|---|
| **skutočná 0** | TN (správne) | FP (falošný poplach) |
| **skutočná 1** | FN (prehliadnuté) | TP (správne) |

- **Accuracy** = (TP + TN) / všetky – podiel správnych predikcií.
- **Precision** = TP / (TP + FP) – koľko z označených pozitívnych je naozaj pozitívnych.
- **Recall** = TP / (TP + FN) – koľko zo skutočne pozitívnych sme našli.

> Pozor na accuracy pri nevyvážených triedach: ak má 99 % pacientov negatívny test, model „vždy negatívny" dosiahne
> 99 % accuracy a pritom nenájde ani jedného chorého (recall = 0).

## Underfitting a overfitting

| | Underfitting (podtrénovanie) | Dobrý model | Overfitting (pretrénovanie) |
|---|---|---|---|
| Model | príliš jednoduchý | tak akurát | príliš zložitý |
| Čo zachytí | ani trend | trend áno, šum nie | **naučí sa aj šum** |
| Chyba | vysoká všade | nízka všade | train výborný, test slabý |
| Príklad | train 63 %, test 61 % | train 91 %, test 88 % | train 100 %, test 71 % |

- Nerozhoduje len výška presnosti, ale aj **rozdiel medzi train a test** (veľký rozdiel = overfitting).
- Čo zvyšuje zložitosť: väčšie `max_depth` stromu, väčšie `C` a `gamma` pri SVM, **menšie** `k` pri KNN.

### Parametre vs. hyperparametre

| | Parametre | Hyperparametre |
|---|---|---|
| Kto ich nastaví | model sám z dát počas `fit()` | my, **pred učením** |
| Príklad | pravidlá v uzloch stromu, váhy SVM | `max_depth`, `C`, `kernel`, `n_neighbors` |
| Úloha | to, čo sa model naučil | riadia zložitosť modelu |

Ladenie hyperparametrov bez použitia testovacích dát: `train_test_split` (validačná časť), krížová validácia,
vnorená krížová validácia.

## Regresia so SVR (cvičenie 3)

- **Regresia**: cieľ je číslo, nie trieda. Boston housing: 506 oblastí, 13 príznakov, cieľ = medián ceny domu.
- `svm.SVR(kernel='linear' | 'poly' | 'rbf')` – support vector regression.
- **`score` regresora vracia R²** (koeficient determinácie), nie accuracy. R² = podiel rozptylu vysvetlený modelom;
  1.0 = dokonalá zhoda, 0 = model nie je lepší ako priemer.
- `metrics.r2_score(y_test, y_pred)`, `metrics.mean_absolute_error(y_test, y_pred)` – MAE = priemerná chyba
  v jednotkách cieľa (tisíce dolárov).
- **Škálovanie**: SVR pracuje so vzdialenosťami medzi vzorkami, príznaky majú veľmi rozdielne rozsahy →
  `StandardScaler`. **Škálovač sa učí iba na trénovacej množine** a potom sa aplikuje na obe:

```python
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)   # fit + transform na tréningu
X_test = scaler.transform(X_test)         # na teste iba transform!
```

- Skóre na tréningu je optimistické (lineárne jadro: R² 0.714 na tréningu, 0.651 na teste).

## API ťahák

| Model | Import | Typické parametre |
|---|---|---|
| `Perceptron` | `sklearn.linear_model` | `eta0=0.1`, `max_iter=40`, `random_state=0` |
| `LogisticRegression` | `sklearn.linear_model` | – |
| `SVC` | `sklearn.svm` | `kernel='linear'/'rbf'`, `C`, `gamma`, `random_state` |
| `SVR` | `sklearn.svm` (`svm.SVR`) | `kernel='linear'/'poly'/'rbf'` |
| `DecisionTreeClassifier` | `sklearn.tree` | `criterion`, `max_depth`, `min_samples_leaf`, `min_samples_split`, `random_state` |
| `RandomForestClassifier` | `sklearn.ensemble` | `n_estimators`, `criterion`, `random_state`, `n_jobs` |
| `KNeighborsClassifier` | `sklearn.neighbors` | `n_neighbors=5`, `p=2`, `metric='minkowski'` |
| `StandardScaler` | `sklearn.preprocessing` | `fit`, `transform`, `fit_transform` |
| `train_test_split` | `sklearn.model_selection` | `test_size`, `random_state`, `stratify` |
| `accuracy_score`, `r2_score`, `mean_absolute_error` | `sklearn.metrics` | `(y_true, y_pred)` |
| `make_classification`, `make_blobs` | `sklearn.datasets` | `n_samples`, `n_features`, `n_informative`, `centers`, `random_state` |

## Rýchle zhrnutie

- Perceptrón: lineárny klasifikátor, aktivačná funkcia jednotkový skok, konverguje len na lineárne separovateľných dátach, minimalizuje chybu zaradenia.
- SVM maximalizuje margin; hranicu určujú podporné vektory; rieši sa kvadratickým programovaním.
- Slack premenná dovolí chyby; `C` = kompromis medzi šírkou marginu a nesprávnym zaradením; veľké C → pretrénovanie.
- Kernelizácia = mapovanie do viacrozmerného priestoru pre lineárne neseparovateľné dáta (XOR); RBF má `gamma`, veľká gamma → pretrénovanie.
- Strom: vnútorný uzol = rozhodnutie, vetva = výsledok, list = trieda/hodnota; delí sa podľa najvyššieho informačného zisku (Gini, entropia).
- Strom je interpretovateľný a nepotrebuje škálovanie, ale ľahko sa pretrénuje → orezávanie, `max_depth`.
- Vysoká entropia = dáta vo viacerých triedach; čistý uzol má entropiu 0.
- Náhodný les = ensemble stromov: bagging (bootstrap s opakovaním) + náhodný výber atribútov + majority voting; menej pretrénovania, horšia interpretovateľnosť.
- KNN = lenivý, instance-based; malé k → overfitting, veľké k → underfitting; všetky premenné rovnako dôležité; trpí kliatbou dimenzionality.
- Kliatba dimenzionality: N_features >> N_samples, rastú vzdialenosti, pamäť, výpočet; klasifikátory sa pretrénujú.
- XGBoost = boosting (stromy postupne opravujú chyby), Random Forest = bagging; No free lunch: žiadny model nie je najlepší vždy.
- Overfitting: train výborný, test slabý; underfitting: chyba vysoká všade.
- Parametre sa učia vo `fit()`, hyperparametre nastavujeme pred učením.
- Test sa nesmie použiť na učenie ani ladenie (data leakage); škálovač `fit` iba na tréningu.
- Regresor: `score` = R²; `r2_score`, `mean_absolute_error`; `predict_proba` lesa = podiel hlasov stromov.
