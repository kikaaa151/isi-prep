# Základy: Python, NumPy, Matplotlib a pojmy strojového učenia

## Čo je strojové učenie

Strojové učenie (ML) = algoritmy, ktoré sa **z dát naučia model** a ten potom použijú na predikciu pre nové,
nevidené dáta. Pravidlá neprogramujeme ručne – model si ich odvodí z príkladov.

Príklady použitia z prednášky:

- **DNN** (deep neural networks, hlboké neurónové siete) – rozpoznávanie vozidiel, ľudí, povrchu vozovky, čiar na ceste.
- **LLM** (large language models) – veľké jazykové modely.
- Rozpoznanie a identifikácia hlasu, rozpoznávanie tváre a pohybov.
- **Sentiment analysis** – identifikácia a klasifikácia názorov vyjadrených v texte, najčastejšie
  negatívny / pozitívny / neutrálny (mapovanie názoru populácie na určitú tému).
- Rozpoznanie podozrivých bankových operácií, **spam filter**, medicína.

Spam filter z prednášky v troch riadkoch (text → čísla → klasifikátor):

```python
vec = CountVectorizer()
X = vec.fit_transform(emails)
model = LinearSVC().fit(X, labels)
```

## Terminológia a označenie

| Pojem | Synonymá | Označenie | Význam |
|---|---|---|---|
| **vzorka** | pozorovanie, inštancia, riadok | riadok matice `X` | jedno „uskutočnené meranie" |
| **príznak** | atribút, vlastnosť, feature, stĺpec | stĺpec matice `X` | „nameraná hodnota"; počet príznakov **určuje dimenzionalitu** |
| **označenie triedy** | cieľová premenná, label, target | vektor `y` | to, čo chceme predpovedať |

- `X` má tvar `(počet vzoriek, počet príznakov)` – vždy **2D**; `y` má tvar `(počet vzoriek,)`.
- Príklad z cvičenia: študent = vzorka; vek, študijný priemer, absencie, hodiny spánku = príznaky (časť X);
  „zvládne skúšku áno/nie" = cieľová premenná (časť Y).
- Iris („hello world" strojového učenia): **150 vzoriek, 4 príznaky** (sepal length, sepal width, petal length,
  petal width), **3 triedy** (setosa, versicolor, virginica) → `iris.data.shape == (150, 4)`,
  `iris.target.shape == (150,)`.

## Základné koncepty ML

| Koncept | Čo má k dispozícii | Úlohy | Príklady |
|---|---|---|---|
| **Učenie s učiteľom** (supervised) | vzorky **aj správne odpovede** `y` | **klasifikácia**, **regresná analýza** | detekcia tumoru zo skenu, rozpoznávanie čísel, identifikácia spam/ham |
| **Učenie bez učiteľa** (unsupervised) | iba vzorky, **bez** `y` | **klastrovanie** (clustering), **redukcia dimenzionality** | marketing: zákazníci s rovnakou preferenciou, identifikácia témy blogu |
| **Učenie posilňovaním** (reinforcement) | agent, prostredie, odmena | učenie stratégie z odmien | hry, riadenie |

### Klasifikácia vs. regresia

| | Klasifikácia | Regresia |
|---|---|---|
| Výstup | **diskrétna trieda** (kategória) | **spojitá číselná hodnota** |
| Príklad z kurzu | druh kvetu Iris, osoba na fotke, spam/ham | cena pizze podľa priemeru, cena domu (Boston) |
| Metrika | accuracy, precision, recall | R² (koeficient determinácie), stredná absolútna chyba |
| Modely | `LogisticRegression`, `SVC`, `DecisionTreeClassifier` … | `LinearRegression`, `SVR` … |

> Pozor: **`LogisticRegression` je klasifikátor.** „Regression" je iba názov algoritmu, úloha je klasifikačná.

## Systém strojového učenia – postup

1. **Načítanie dát** a výber trénovacej sady (napr. 75 % vzoriek).
2. **Zobrazenie dát** (pozrieť sa, ako sú triedy rozložené).
3. **Trénovanie** – `fit(X_train, y_train)`: model sa učí parametre.
4. **Predikcia** – `predict(X_new)`: využíva naučený model.
5. **Vyhodnotenie** – porovnanie predikcie so skutočnosťou na trénovacej aj testovacej časti.

Prečo delíme dáta: úspešnosť na trénovacích dátach je príliš optimistická; skutočnú kvalitu ukáže až
**testovacia množina**, ktorú model pri učení nevidel.

## Prvý príklad: lineárna regresia (pizza)

Lineárna regresia **modeluje lineárny vzťah medzi atribútom a cieľovou premennou**. Na základe dát sa naučí
parametre (A, B) modelu **y = A + B·x**.

| Priemer (palce) | 6 | 8 | 10 | 14 | 18 |
|---|---|---|---|---|---|
| Cena ($) | 7 | 9 | 13 | 17.5 | 18 |

```python
from sklearn.linear_model import LinearRegression
X = [[6], [8], [10], [14], [18]]      # 2D: 5 vzoriek, 1 príznak
y = [[7], [9], [13], [17.5], [18]]
model = LinearRegression()
model.fit(X, y)                                           # FIT – naučí sa
model.predict(np.array([12]).reshape(-1, 1))              # PREDICT → 13.68
```

- `model.coef_` = **B** (sklon) ≈ 0.976, `model.intercept_` = **A** (posun, hodnota pre x = 0) ≈ 1.966.
- Kontrola: 1.966 + 0.976 · 12 ≈ 13.68 $.
- `reshape(-1, 1)` = „jeden stĺpec, počet riadkov dopočítaj" → z `[12]` spraví `[[12]]` (1 vzorka, 1 príznak).

## Druhý príklad: klasifikácia Iris

```python
from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn import metrics

iris = datasets.load_iris()
X_iris, y_iris = iris.data, iris.target
X, y = X_iris[:, :2], y_iris                     # iba prvé dva príznaky
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)

clf = LogisticRegression()
clf.fit(X_train, y_train)
clf.predict(np.array([5.3, 4.1]).reshape(1, -1))  # jedna vzorka → [0]
metrics.accuracy_score(y_train, clf.predict(X_train))   # 0.82
metrics.accuracy_score(y_test, clf.predict(X_test))     # 0.68
```

- Po rozdelení 150 vzoriek s `test_size=0.25`: **112 trénovacích, 38 testovacích** (test sa zaokrúhľuje nahor).
- `reshape(1, -1)` = „jeden riadok" → jedna vzorka s dvoma príznakmi, tvar `(1, 2)`.
- Presnosť na teste (0.68) je nižšia ako na tréningu (0.82) – dva príznaky sepal nestačia na oddelenie
  versicolor a virginica.

## Rozhranie scikit-learn

Všetky modely majú rovnaké rozhranie:

| Volanie | Čo robí |
|---|---|
| `model = Trieda(hyperparametre)` | vytvorí nenaučený model |
| `model.fit(X_train, y_train)` | **učenie** – nastaví parametre modelu z dát |
| `model.predict(X_test)` | **predikcia** – použije naučený model, vráti pole tried / hodnôt |
| `model.score(X, y)` | klasifikátor: accuracy; regresor: R² |
| `train_test_split(X, y, test_size=0.25, random_state=33)` | vráti **`X_train, X_test, y_train, y_test`** (v tomto poradí) |

- `test_size` – podiel testovacích vzoriek; `random_state` – semienko, aby bolo rozdelenie opakovateľné;
  `stratify=y` – zachová pomer tried v oboch častiach.
- `train_test_split` dáta pred rozdelením **zamieša**.
- Datasety: `datasets.load_iris()`, `datasets.load_digits()` – objekt s atribútmi `.data` (X), `.target` (y),
  `.target_names`, `.DESCR`; číslice majú navyše `.images`.

## Metriky kvality predikcie

Matica zámen pre dve triedy (m = počet vzoriek, **m = TP + FN + FP + TN**):

| | predikcia: pozitívna | predikcia: negatívna |
|---|---|---|
| **skutočnosť: pozitívna** | TP (true positive) | FN (false negative – prehliadnuté) |
| **skutočnosť: negatívna** | FP (false positive – falošný poplach) | TN (true negative) |

- **Accuracy** (presnosť klasifikácie) = (TP + TN) / m – podiel správnych predikcií.
- **Chyba** = (FP + FN) / m = 1 − accuracy.
- **Precision** = TP / (TP + FP) – koľko z označených pozitívnych je naozaj pozitívnych.
- **Recall** = TP / (TP + FN) – koľko zo skutočne pozitívnych sme našli.
- V kóde: `metrics.accuracy_score(y_true, y_pred)` alebo ručne `(y_test == y_pred).mean()`.

## Dáta

### Základné kroky spracovania dát

| Krok | Čo znamená |
|---|---|
| **čistenie dát** | odstránenie nekvalitných a nekonzistentných dát |
| **integrácia dát** | napr. kombinácia rôznych dátových zdrojov |
| **výber dát** | výber relevantných dát z databáz |
| **transformácia dát** | preprocessing, konsolidácia a transformácia do podoby vhodnej pre dolovanie znalostí |
| **dolovanie znalostí** | aplikácia učiacich sa algoritmov s cieľom extrahovať vzory a pravidlá |
| **ohodnotenie naučeného modelu** | posúdenie kvality na základe objektívneho kritéria |
| **reprezentácia znalostí** | naučená znalosť je používateľovi vizualizovaná alebo inak prezentovaná |

### Forma dát

- **matica dát** (vzorky × príznaky) – najčastejšia,
- **dokumenty** – frekvencia výskytu slov v dokumente,
- **grafy** – napr. schéma zapojenia.

### Vlastnosti dát

- **veľké množstvo dát, vysoká dimenzionalita** – náročné na pamäť a spracovanie,
- **riedke (sparse) dáta** – zaznamenaná je napr. iba prítomnosť v kategórii, **veľa nulových hodnôt**,
- **šum**,
- **outliers** – body ležiace mimo prevažnú časť dát.

### Typy dát

| Typ | Popis | Príklad |
|---|---|---|
| **nominálne** (nominal, categorical) | kategórie **bez poradia**; binominálne (2 hodnoty), polynominálne (viac hodnôt) | farba, pohlavie, druh kvetu |
| **ordinálne** (ordinal) | kategórie, ktoré **nasledujú za sebou** (majú poradie) | veľkosť S < M < L, stupeň vzdelania |
| **numerické** (numeric) | reálne, celočíselné, interval, percentá | priemer pizze, vek |
| **špeciálne** | obraz, zvuk, časová postupnosť, video | fotografie tvárí, číslice |

## NumPy v kocke

```python
import numpy as np
a = np.arange(15).reshape(3, 5)   # čísla 0..14 v matici 3 riadky × 5 stĺpcov
```

| Výraz | Výsledok | Poznámka |
|---|---|---|
| `a.shape` | `(3, 5)` | (riadky, stĺpce) |
| `a.size` | `15` | počet všetkých prvkov |
| `a.sum()` | `105` | súčet všetkého |
| `a.sum(axis=1)` alebo `a.sum(1)` | `[10 35 60]` | súčet **v každom riadku**, tvar `(3,)` |
| `a.sum(axis=0)` alebo `a.sum(0)` | `[15 18 21 24 27]` | súčet **v každom stĺpci**, tvar `(5,)` |
| `X[:, :2]` | prvé dva stĺpce | všetky riadky, stĺpce 0 a 1 |
| `X[:, [2, 3]]` | stĺpce 2 a 3 | výber zoznamom indexov |
| `X[:, 0][y == i]` | hodnoty 1. stĺpca pre vzorky triedy `i` | **booleovská maska** |
| `np.array([12]).reshape(-1, 1)` | tvar `(1, 1)` | −1 = „dopočítaj" |
| `np.array([5.3, 4.1]).reshape(1, -1)` | tvar `(1, 2)` | jedna vzorka, dva príznaky |
| `np.linspace(0, 20, 21)` | 0, 1, …, 20 | 21 rovnomerne rozložených bodov vrátane koncov |
| `np.where(podmienka, 1, -1)` | 1 tam, kde platí, inak −1 | |
| `np.logical_xor(a, b)` | True, ak platí práve jedno | XOR dáta v prednáške |
| `np.vstack((A, B))`, `np.hstack((a, b))` | spojenie pod seba / vedľa seba | |
| `np.unique(y)` | zoradené rôzne hodnoty | zoznam tried |

> Pozor: `axis` hovorí, **cez ktorú os sa sčíta (ktorá os zmizne)**. `axis=0` → ostane jeden údaj na stĺpec,
> `axis=1` → jeden údaj na riadok.

## Matplotlib v kocke

```python
import matplotlib.pyplot as plt
```

| Volanie | Na čo |
|---|---|
| `plt.figure(1, figsize=(3, 3))` | nový obrázok, veľkosť v palcoch |
| `plt.plot(X, y, 'k.', markersize=15)` | čiarový/bodový graf; `'k.'` čierne body, `'k-'` čierna čiara, `'r.'` červené body, `'b+'` modrý krížik |
| `plt.scatter(xs, ys, c='red')` | bodový graf (rozptyl) |
| `plt.imshow(digits.images[idx], cmap=plt.cm.gray_r)` | zobrazenie matice ako obrázka |
| `plt.title`, `plt.xlabel`, `plt.ylabel`, `plt.legend` | popisy |
| `plt.axis([0, 25, 0, 25])` | rozsah osí `[xmin, xmax, ymin, ymax]` |
| `plt.grid(True)` | mriežka |
| `fig, axes = plt.subplots(2, 5, figsize=(8, 3.5))` | mriežka 2 × 5 grafov; `axes.ravel()` ju sploští na 10 osí |
| `plt.tight_layout()` | upraví okraje |
| `plt.show()` | vykreslí |

Dataset číslic: `digits = datasets.load_digits()` → `digits.data.shape == (1797, 64)`, `digits.images` má tvar
`(1797, 8, 8)` (obrázky 8 × 8 = 64 príznakov), `digits.target` sú číslice 0–9.

## Jupyter notebook vs. skript

- **Bunka (cell)** = samostatný kúsok kódu alebo textu, spúšťa sa samostatne (`Shift+Enter`).
- Všetky bunky zdieľajú **jeden bežiaci kernel** → premenné z jednej bunky sú dostupné v ďalších.
- **Posledný výraz v bunke sa vypíše automaticky**, netreba `print(...)`.
- Výhoda: pomalé načítanie dát spustíme **raz**, vykresľovanie opakujeme a meníme bez nového načítania.

| Skript (`.py`) | Notebook (`.ipynb`) |
|---|---|
| vždy sa spustí celý od začiatku | spustíš len jednu bunku |
| výsledok len v konzole | výstup je hneď pod kódom |
| zmena jedného riadku = nový beh | zmena a opätovné spustenie jednej bunky |
| kód a vysvetlenie oddelene | kód, výstup a text na jednom mieste |

> Pozor: stav kernelu závisí od **poradia spúšťania buniek**. Pri neistote *Kernel → Restart & Run All*.

## Python minimum

- **f-string**: `print(f"Shape: {a.shape}")`; staršie formátovanie: `'%.2f' % hodnota`, `"{0:.3f}".format(x)`.
- **Zoznam** `[6, 8, 10]`, vnorený zoznam `[[6], [8]]` (zoznam vzoriek, každá s jedným príznakom).
- **Slovník** `{'kluc': hodnota}`, prechod `for k, v in d.items():`.
- `for i in range(5):` → 0 až 4; `range(1, 21)` → 1 až 20.
- `zip(a, b, c)` – paralelný prechod viacerými zoznamami; skončí po najkratšom.
- pandas z domácej úlohy: `pd.DataFrame(data=pole, index=mena_riadkov, columns=mena_stlpcov)`,
  `pd.concat([A_df, B_df])` spojí riadky, `df['cubes']` vyberie stĺpec.

## Typické pasce

- `predict` chce **2D pole** – jednu vzorku treba `reshape(1, -1)`.
- Poradie výstupov `train_test_split`: `X_train, X_test, y_train, y_test` (nie X_train, y_train, …).
- `a.sum(1)` je súčet riadkov, nie stĺpcov.
- Logistická regresia = klasifikácia; lineárna regresia = regresia.
- Accuracy na trénovacích dátach nehovorí, ako bude model fungovať na nových dátach.
- Klastrovanie a redukcia dimenzionality **nie sú** učenie s učiteľom.

## Rýchle zhrnutie

- Vzorka = riadok, príznak = stĺpec (určuje dimenzionalitu), cieľová premenná = `y`.
- Tri koncepty: učenie s učiteľom (klasifikácia, regresia), bez učiteľa (klastrovanie, redukcia dimenzionality), posilňovaním.
- Klasifikácia → diskrétna trieda; regresia → spojité číslo.
- Lineárna regresia sa učí A, B modelu y = A + B·x; `intercept_` = A, `coef_` = B.
- `LogisticRegression` je klasifikátor – „regression" je len názov.
- Postup: načítanie → rozdelenie → `fit` → `predict` → vyhodnotenie na train aj test.
- `train_test_split(X, y, test_size=0.25, random_state=33)` → `X_train, X_test, y_train, y_test`; Iris: 112 / 38.
- Accuracy = (TP + TN) / m, m = TP + FN + FP + TN; precision = TP / (TP + FP); recall = TP / (TP + FN).
- Kroky spracovania dát: čistenie, integrácia, výber, transformácia, dolovanie, ohodnotenie, reprezentácia.
- Typy dát: nominálne (bez poradia), ordinálne (s poradím), numerické, špeciálne (obraz, zvuk, čas. rad, video).
- Vlastnosti dát: veľký objem a dimenzionalita, riedke dáta (veľa núl), šum, outliers.
- `np.arange(15).reshape(3, 5)`: `shape (3, 5)`, `size 15`, `sum(1)` = `[10 35 60]`, `sum(0)` = `[15 18 21 24 27]`.
- `reshape(1, -1)` = jedna vzorka (riadok); `reshape(-1, 1)` = jeden príznak (stĺpec).
- Notebook: bunky zdieľajú kernel, posledný výraz sa vypíše, stav závisí od poradia spúšťania.
