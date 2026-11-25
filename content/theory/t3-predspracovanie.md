# Predspracovanie dát: pandas, kódovanie, škálovanie, imputácia

Predspracovanie = **príprava dát pred aplikáciou predikčného algoritmu**. Algoritmy scikit-learn očakávajú číselnú maticu bez chýbajúcich hodnôt, preto treba dáta najprv spoznať, vyčistiť, zakódovať a (väčšinou) preškálovať.

## Typický postup

1. **Oboznámiť sa s dátami** – formát, chýbajúce hodnoty, diskrétne vs. spojité atribúty, vizualizácia.
2. **Vybrať atribúty** – zahodiť irelevantné (identifikátory, stĺpce s takmer samými chýbajúcimi hodnotami).
3. **Vyriešiť chýbajúce hodnoty** – eliminácia alebo imputácia.
4. **Zakódovať kategorické atribúty** – mapovanie, `LabelEncoder`, one-hot.
5. **Rozdeliť dáta** na trénovacie a testovacie.
6. **Preškálovať** atribúty – normalizácia alebo štandardizácia.
7. Natrénovať model a vyhodnotiť ho na testovacích dátach.

> Pozor: kroky, ktoré sa niečo „učia“ z dát (imputácia priemerom, škálovanie), sa metodicky správne robia až **po rozdelení** – `fit` iba na trénovacích dátach. Na cvičení s Titanicom sa imputovalo pred rozdelením; je to vedomé zjednodušenie (správny postup bol domáca úloha).

## Oboznámenie sa s dátami v pandas

| Volanie | Čo robí |
|---|---|
| `pd.read_csv('data/titanic.txt')` | načíta súbor do `DataFrame` (riadok = vzorka, stĺpec = atribút) |
| `df.head()` | prvých 5 riadkov |
| `df.info()` | stĺpce, počet nenulových hodnôt, dátové typy |
| `df.describe(include="all")` | základné štatistiky (count, mean, std, min, kvartily, max; pri textových unique, top, freq) |
| `df.isna().sum()` / `df.isnull().sum()` | počet chýbajúcich hodnôt v každom stĺpci |
| `df.survived.value_counts()` | početnosť jednotlivých hodnôt (rozdelenie tried) |
| `df.groupby("sex")["survived"].mean()` | priemer cieľa v skupinách (podiel preživších podľa pohlavia) |
| `df.drop(columns=[...])` | **vráti nový** DataFrame bez uvedených stĺpcov |
| `df.loc[12]` | riadok podľa **menovky** indexu |
| `df.iloc[:, 1]` | výber podľa **pozície** (všetky riadky, druhý stĺpec) |
| `df["age"] = pole` | zapíše (prepíše) stĺpec |
| `np.array(df.survived)` | stĺpec ako NumPy pole |

## Chýbajúce dáta

Chýbajúca hodnota sa v pandas a NumPy reprezentuje ako **NaN** (Not a Number). Pozor: `nan != nan`, preto sa NaN hľadá cez `np.isnan(x)` alebo `df.isna()`, nie porovnaním.

### A. Eliminácia

Odstránia sa **vzorky** (riadky) alebo **atribúty** (stĺpce) s chýbajúcimi hodnotami.

| Volanie | Výsledok |
|---|---|
| `df.dropna()` | zahodí riadky, v ktorých chýba aspoň jedna hodnota |
| `df.dropna(axis=1)` | zahodí stĺpce, v ktorých chýba aspoň jedna hodnota |
| `df.dropna(thresh=4)` | ponechá len riadky, ktoré majú aspoň 4 nechýbajúce hodnoty |

Nevýhoda: **nenávratná strata dát / informácií**. V Titanicu chýba vek pri 680 z 1313 cestujúcich – odstránením riadkov by zmizla viac než polovica datasetu.

### B. Imputácia

Imputácia = **dopočítanie chýbajúcej hodnoty** na základe ostatných hodnôt daného atribútu (stĺpca) – priemer, medián, …

```python
from sklearn.impute import SimpleImputer

impute = SimpleImputer()                     # predvolene strategy='mean'
iris_X_prime = impute.fit_transform(iris_X)
impute = SimpleImputer(strategy='median')
```

| Stratégia | Dopĺňa | Poznámka |
|---|---|---|
| `mean` (predvolená) | priemer stĺpca | citlivý na odľahlé hodnoty |
| `median` | medián stĺpca | odolnejší voči odľahlým hodnotám |
| `most_frequent` | najčastejšiu hodnotu | použiteľná aj pre kategorické atribúty |

- Štatistika sa počíta **po stĺpcoch** a iba zo známych hodnôt.
- `fit` sa štatistiku naučí (uložená v `statistics_`), `transform` ju dosadí; dáta pre `transform` musia mať rovnaký počet stĺpcov ako dáta pre `fit`.
- V starších verziách scikit-learn sa trieda volala `Imputer` (takto je v prednáške); dnes `sklearn.impute.SimpleImputer`.
- Doplnenie konštantou skresľuje rozdelenie atribútu – všetky doplnené hodnoty padnú do jedného bodu.

Ručná imputácia priemerom v NumPy (Titanic):

```python
ages = np.array(titanic_reduced.iloc[:, 1])
mean_age = np.mean(ages[~np.isnan(ages)])   # priemer iba zo známych hodnôt
ages[np.isnan(ages)] = mean_age             # dosadenie cez masku
titanic_reduced["age"] = ages
```

> Pozor: `np.mean(ages)` na poli s NaN vráti `nan`. Treba masku `~np.isnan(ages)` (alebo `np.nanmean`).

## Kategorické dáta

Modely počítajú s číslami, preto treba kategorické hodnoty zakódovať – kvôli **kompatibilite s matematickými modelmi**.

| Typ atribútu | Vlastnosť | Príklad |
|---|---|---|
| numerický | číslo, s ktorým sa dá počítať | vek, cena |
| kategorický **ordinálny** | hodnoty majú prirodzené **poradie** | veľkosť S < M < L < XL < XXL |
| kategorický **nominálny** | hodnoty **nemajú poradie** | farba: červený, zelený, modrý, čierny |

### Ordinálne atribúty – mapovanie

Poradie treba zachovať, preto sa mapovanie zadáva ručne slovníkom a metódou `map` z pandas:

```python
size_mapping = {'S': 1, 'M': 2, 'L': 3, 'XL': 4}
df['size'] = df['size'].map(size_mapping)
```

`LabelEncoder` by tu poradie pokazil – čísluje abecedne (L → 0, M → 1, S → 2, XL → 3).

### Označenie tried a LabelEncoder

Označenie tried (cieľový atribút) je nominálne – „chorá“ → 0, „zdravá“ → 1; „pop“ → 0, „rock“ → 1, „classical“ → 2. **Poradie je irelevantné**, na konkrétnych číslach nezáleží.

```python
enc = LabelEncoder()
enc.fit(titanic_reduced["sex"])
print(enc.classes_)                                   # ['female' 'male']
titanic_reduced["sex"] = enc.transform(titanic_reduced["sex"])
```

- `classes_` – nájdené hodnoty **zoradené abecedne**; hodnota sa nahradí svojím indexom (female → 0, male → 1).
- `fit_transform` spraví oba kroky naraz; `inverse_transform` vráti pôvodné označenia.

### Problém pri nominálnych atribútoch

Zakódovanie červený → 0, zelený → 1, modrý → 2 zavedie do dát **vzťah, ktorý neexistuje**: model si bude myslieť, že modrý > zelený > červený. Pri atribúte s dvoma hodnotami (pohlavie 0/1) to nevadí.

### Riešenie: one-hot kódovanie

Každá hodnota nominálneho atribútu dostane **vlastný stĺpec 0/1**; v každom riadku je práve jedna jednotka.

| farba | f_black | f_green | f_red |
|---|---|---|---|
| green | 0 | 1 | 0 |
| black | 1 | 0 | 0 |
| red | 0 | 0 | 1 |

```python
ohe = OneHotEncoder()
pclass_reshaped = np.array(titanic_reduced["pclass"]).reshape(-1, 1)
ohe.fit(pclass_reshaped)
ohe_coded = ohe.transform(pclass_reshaped).toarray()
```

- Vstup musí byť **2D** – `reshape(-1, 1)` spraví z vektora maticu n × 1.
- `transform` vracia **riedku maticu**; `.toarray()` ju prevedie na bežné pole.
- Atribút s *k* hodnotami sa nahradí *k* stĺpcami – rastie počet atribútov.
- V pandas robí to isté `pd.get_dummies(df)`.

| | Label encoding | One-hot encoding |
|---|---|---|
| Výsledok | 1 stĺpec s číslami 0 … k−1 | k stĺpcov 0/1 |
| Poradie | zavedie umelé poradie | žiadne poradie |
| Vhodné pre | označenie tried, binárne atribúty | nominálne atribúty s viac hodnotami |
| Nevýhoda | môže zaviesť neexistujúci vzťah | viac atribútov |

## Odľahlé hodnoty a diskretizácia

- **Odľahlá hodnota (outlier)** – hodnota výrazne vzdialená od ostatných.
- Cieľom detekcie môže byť **nájsť** také hodnoty (napr. detekcia podvodov – fraud detection) alebo od nich **vyčistiť dáta**; čistenie však znamená stratu informácie.
- **Diskretizácia** – prevod spojitého atribútu na intervaly (napr. vek → veková skupina).

## Rozdelenie na trénovacie a testovacie dáta

- **Trénovacie** dáta: natrénovanie modelu, naladenie parametrov.
- **Testovacie** dáta: finálne overenie.
- Vo fáze trénovania nesmú byť testovacie dáta **nijako** použité – *nikdy sa nedotýkaj testovacích dát*.
- Bežné pomery: 80–20, 90–10, 60–40.
- Po natrénovaní a otestovaní sa model pretrénuje na **celej** dátovej sade.

```python
X_train, X_test, y_train, y_test = train_test_split(
    titanic_reduced, titanic_y, test_size=0.25, random_state=33)
```

- Poradie výstupov: `X_train, X_test, y_train, y_test`.
- `test_size=0.25` – štvrtina dát do testu (1313 vzoriek → 984 + 329); `random_state` zaručí rovnaké rozdelenie pri každom spustení.

## Škálovanie

Škálovanie zabezpečí, aby boli rôzne atribúty na **podobnej škále** a prispievali do učenia rovnako. Výrazne zlepšuje správanie učiacich sa a optimalizačných algoritmov.

- **Citlivé** na mierku: KNN (vzdialenosti), SVM, najmä s RBF kernelom (vzdialenosti), modely učené gradientovými metódami.
- **Výnimka**: rozhodovacie stromy (a náhodné lesy) – delia podľa prahu jedného atribútu, mierka im je jedno.

| | Normalizácia (min-max) | Štandardizácia |
|---|---|---|
| Vzorec | `x' = (x − min) / (max − min)` | `x' = (x − μ) / σ` |
| Výsledok | pevný rozsah **[0, 1]** | priemer **0**, štandardná odchýlka **1** (jednotkový rozptyl) |
| Rozsah | ohraničený | neohraničený |
| Odľahlé hodnoty | veľmi citlivá (min a max určia rozsah) | menej citlivá |
| scikit-learn | `MinMaxScaler` | `StandardScaler` |

```python
from sklearn.preprocessing import MinMaxScaler, StandardScaler

mms = MinMaxScaler()
X_train_norm = mms.fit_transform(X_train)
X_test_norm = mms.transform(X_test)

stdsc = StandardScaler()
X_train_std = stdsc.fit_transform(X_train)
X_test_std = stdsc.transform(X_test)
```

Na cvičení (wine): pred škálovaním priemery `[13.0, 2.34, 2.37]` a odchýlky `[0.81, 1.11, 0.27]`, po `StandardScaler` priemery ≈ 0 a odchýlky `[1. 1. 1.]`.

## fit, transform, fit_transform

| Metóda | Čo robí | Na akých dátach |
|---|---|---|
| `fit(X)` | **naučí sa** parametre (priemer, odchýlku, min/max, triedy, …) | iba trénovacie |
| `transform(X)` | **použije** naučené parametre na dáta | trénovacie aj testovacie |
| `fit_transform(X)` | `fit` + `transform` naraz | iba trénovacie |

> Na teste: **fit – trénovacie, transform – trénovacie, transform – testovacie, fit na testovacích – NIE!** Testovacie dáta sa škálujú (imputujú) parametrami naučenými z trénovacích dát. Hodnoty testovacích dát preto po min-max škálovaní môžu vyjsť aj mimo [0, 1].

Prečo: `fit` na testovacích dátach (alebo na všetkých dátach pred rozdelením) prenesie do trénovania informáciu o testovacej množine a odhad výkonnosti bude príliš optimistický.

## Cvičenie: Titanic krok za krokom

Dataset: 1313 cestujúcich, 11 stĺpcov, cieľ `survived` (864 neprežilo, 449 prežilo).

| Krok | Čo sa robí | Čím |
|---|---|---|
| 1 | načítanie, cieľ do `titanic_y` | `pd.read_csv`, `np.array(titanic_data.survived)` |
| 2 | ponechajú sa `pclass`, `age`, `sex` | `drop(columns=[...])` |
| 3 | chýbajúci vek (680 hodnôt) → priemer 31.19 | NumPy maska `np.isnan` |
| 4 | `sex`: female/male → 0/1 | `LabelEncoder` |
| 5 | `pclass`: 1st/2nd/3rd → 0–2 → tri stĺpce `class 1..3` | `LabelEncoder` + `OneHotEncoder` |
| 6 | rozdelenie 75/25, rozhodovací strom, presnosť ≈ 0.78 | `train_test_split`, `tree.DecisionTreeClassifier`, `metrics.accuracy_score` |
| 7 | vykreslenie stromu, matica zámien, dôležitosť atribútov | `tree.plot_tree`, `feature_importances_` |

Strom: `tree.DecisionTreeClassifier(criterion='entropy', max_depth=5, min_samples_leaf=5)`. Najdôležitejší atribút je pohlavie (prežilo 66 % žien a 17 % mužov).

## Typické pasce

- `fit` (alebo `fit_transform`) na testovacích dátach – chyba.
- Imputácia alebo škálovanie pred rozdelením dát – únik informácie z testu.
- `LabelEncoder` na nominálny atribút s viac hodnotami – umelé poradie.
- `LabelEncoder` na ordinálny atribút – abecedné poradie nemusí sedieť so skutočným.
- `OneHotEncoder` na 1D pole – chyba, treba `reshape(-1, 1)`; výsledok je riedka matica (`.toarray()`).
- `np.mean` na poli s NaN vráti `nan`.
- `drop` nemení pôvodný DataFrame – výsledok treba priradiť.
- Normalizácia ≠ štandardizácia: pevný rozsah [0, 1] vs. nulový priemer a jednotková odchýlka.
- Stromy škálovanie nepotrebujú, KNN a SVM áno.

## Rýchle zhrnutie

- Predspracovanie: spoznať dáta → vybrať atribúty → chýbajúce hodnoty → kódovanie → rozdelenie → škálovanie.
- Chýbajúce hodnoty (NaN): **eliminácia** (`dropna`, strata dát) alebo **imputácia** (dopočítanie zo stĺpca).
- `SimpleImputer` – predvolene `mean`, ďalej `median`, `most_frequent`.
- Ordinálny atribút má poradie (S < M < L) → `map` so slovníkom; nominálny poradie nemá (farby).
- `LabelEncoder` čísluje hodnoty abecedne (0 … k−1); vhodný na triedy a binárne atribúty.
- Label encoding nominálneho atribútu zavedie neexistujúce poradie → riešenie **one-hot** (k stĺpcov 0/1).
- `OneHotEncoder` chce 2D vstup (`reshape(-1, 1)`) a vracia riedku maticu (`.toarray()`).
- `train_test_split(X, y, test_size=..., random_state=...)` → `X_train, X_test, y_train, y_test`.
- Testovacích dát sa pri trénovaní nikdy nedotýkaj; po overení sa model pretrénuje na celej sade.
- Škálovanie dáva atribútom podobnú škálu; KNN a SVM sú citlivé, rozhodovacie stromy nie.
- Normalizácia = min-max do [0, 1] (`MinMaxScaler`); štandardizácia = priemer 0, odchýlka 1 (`StandardScaler`).
- `fit` iba na trénovacích dátach, `transform` na trénovacích aj testovacích.
- Odľahlé hodnoty: nájsť (fraud detection) alebo vyčistiť (strata informácie); medián a štandardizácia sú voči nim odolnejšie než priemer a min-max.
