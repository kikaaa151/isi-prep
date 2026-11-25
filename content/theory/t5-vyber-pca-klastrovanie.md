# Výber príznakov, PCA a klastrovanie (K-means, DBSCAN)

## Prečo zmenšovať počet príznakov

Prednáška 4 – **pretrénovanie, ako ho vyriešiť?**

- získať viac dát,
- zvoliť jednoduchší model,
- **redukovať dimenzionalitu dát**.

Menej príznakov = jednoduchší a rýchlejší model, menšie pretrénovanie, ľahšia interpretácia. Sú dve cesty:

| | Výber príznakov (feature selection) | Redukcia dimenzionality (PCA) |
|---|---|---|
| Čo robí | vyberie **podmnožinu pôvodných** príznakov | vytvorí **nové** príznaky – lineárne kombinácie pôvodných |
| Význam príznakov | zostáva (`age` je stále vek) | stráca sa (komponent nie je „vek“ ani „príjem“) |
| Potrebuje cieľ `y`? | podľa metódy (rozptyl nie, ostatné áno) | nie – učenie bez učiteľa |
| scikit-learn | `sklearn.feature_selection` | `sklearn.decomposition.PCA` |

## Výber príznakov (feature selection)

### Tri rodiny metód

Prednáška: FS metódy sa delia na **filtrovacie / obalenia (wrapper) / vložené (embedded)**, a tiež na metódy
**s učiteľom / bez učiteľa**.

| Metóda | Ako hodnotí príznaky | Príklad v sklearn | Cena |
|---|---|---|---|
| **filter** (filtrovacia) | štatistika príznaku (rozptyl, vzťah k cieľu…) – **bez modelu** | `VarianceThreshold`, `SelectKBest` | veľmi nízka |
| **wrapper** (obalenie) | **trénuje model na podmnožinách** príznakov a porovnáva skóre | `RFE`, `RFECV`, `SequentialFeatureSelector` | vysoká |
| **embedded** (vložená) | dôležitosť je **vedľajší produkt trénovania** jedného modelu | `SelectFromModel` + náhodný les / L1 regularizácia | stredná |

- Filter nevidí model ani interakcie príznakov, je však najrýchlejší.
- Wrapper vidí interakcie a optimalizuje priamo skóre, ktoré nás zaujíma – za cenu mnohých trénovaní.
- Embedded používa model aj cieľ (na rozdiel od filtra), ale netrénuje model na podmnožinách (na rozdiel od wrappera).

### Filter: `VarianceThreshold` (ex_03)

Najjednoduchší filter: **odstráň príznaky s nízkym rozptylom**. (Takmer) konštantný príznak nenesie (takmer)
žiadnu informáciu.

```python
selector = VarianceThreshold(threshold=0.05)
new_selection = selector.fit_transform(data)      # bez y!
selector.get_feature_names_out()                  # ponechané stĺpce
data.columns[~selector.get_support()]             # odstránené stĺpce
```

- Ponechá stĺpce s rozptylom **väčším** ako `threshold`. Predvolené `threshold=0` odstráni iba konštantné stĺpce
  (domáca úloha *zero variance*: `VarianceThreshold()`).
- Nepoužíva **model ani cieľ** – je to metóda bez učiteľa; `fit_transform` dostane len dáta.
- Na cvičení: zamestnanci (`salary`, `experience`, `graduated`), stĺpec `ID` sa zahodí (`drop(columns=['ID'])` –
  je to identifikátor, nie príznak, a prahom by prešiel hravo), pridá sa umelý stĺpec `spam` ~ rovnomerne z
  ⟨0.9, 1.1⟩ s rozptylom ≈ 0.0035. Výsledok: `(100, 4)` → `(100, 3)`, odstránený je `spam`.

> **Pozor – rozptyl závisí od mierky.** `salary` má rozptyl ≈ 45 782 len preto, že je v eurách; v tisícoch eur by
> mal 0.046 a prah 0.05 by ho odstránil. Binárny príznak má rozptyl `p(1 − p)` – `graduated` s 9 % jednotiek
> má 0.08. Po `MinMaxScaler` (všetko do ⟨0, 1⟩) ten istý prah ponechá `experience`, `graduated`, `spam` a vyhodí
> `salary` – prah treba po škálovaní zvoliť nanovo.

### Filter s cieľom: `SelectKBest` (ex_03 bonus, domáca úloha)

**Univariačný** filter – každému príznaku dá skóre podľa jeho vzťahu k cieľu a ponechá `k` najlepších.

```python
kbest = SelectKBest(f_classif, k=5).fit(X, y)
kbest.scores_            # skóre každého príznaku
kbest.get_support()      # maska vybraných príznakov
```

- Skórovacie funkcie: `f_classif` (ANOVA F-test), `chi2`, vzájomná informácia (mutual information).
- `chi2` vyžaduje **nezáporné** hodnoty – preto sa v domácej úlohe dáta najprv škálujú `MinMaxScaler`-om
  (po `StandardScaler` by `chi2` skončil chybou `Input X must be non-negative`).
- Každý príznak sa hodnotí **samostatne** – filter nevidí, že dva príznaky sú redundantné (nesú tú istú
  informáciu) alebo užitočné iba spolu.
- Na dátach o srdcových chorobách (303 pacientov, 13 príznakov) vyberie `cp`, `thalach`, `exang`, `oldpeak`, `ca`.

### Wrapper: RFE a `RFECV` (ex_04)

**RFE** (Recursive Feature Elimination – rekurzívna eliminácia príznakov):

1. natrénuj model na všetkých príznakoch,
2. odstráň príznak s najmenšou dôležitosťou (lineárny model: najmenšie `|w_i|`),
3. opakuj, kým nezostane požadovaný počet príznakov.

**RFECV** navyše každý počet príznakov vyhodnotí **krížovou validáciou** a nechá ten najlepší – počet príznakov
nemusíme zadať sami.

```python
clf = Pipeline([('scl', StandardScaler()),
                ('clf', SVC(C=1, kernel='linear'))])
selector = RFECV(clf, step=1, cv=5, scoring='accuracy',
                 importance_getter='named_steps.clf.coef_')
X_selected = selector.fit_transform(X, y)
```

- `step=1` – v každom kole vypadne 1 príznak; `cv=5` – 5-násobná krížová validácia.
- Cena: 13 príznakov × 5 foldov ≈ **65 trénovaní**.
- Váhy lineárneho modelu sú porovnateľné, len ak majú príznaky **rovnakú mierku** – inak by `chol` (~250) dostal
  malú váhu len pre veľké hodnoty. Preto je škálovač v pipeline a `importance_getter` hovorí, kde v pipeline
  sú váhy (`named_steps.clf.coef_`). Bez neho RFECV skončí chybou – `Pipeline` nemá `coef_`.
- `coef_` má SVC iba s **lineárnym** jadrom.
- Výstupy: `selector.n_features_` (optimálny počet), `selector.support_` (maska vybraných), `selector.ranking_`
  (1 = vybraný; **čím vyššie číslo, tým skôr vypadol**), `selector.cv_results_` (skóre pre každý počet).
- Výsledok cvičenia: `(303, 13)` → `(303, 11)`; vypadli `age` (rank 3, prvý) a `restecg` (rank 2).
- Krivka skóre býva okolo optima plochá – rozumné je brať **najmenší** počet príznakov, ktorého skóre je do
  jednej smerodajnej odchýlky od najlepšieho.

### Embedded: `SelectFromModel` (ex_05)

Dôležitosť príznakov vznikne pri trénovaní **jedného** modelu:

- **stromové ansámble** (náhodný les, gradient boosting) – `feature_importances_`: o koľko príznak znížil
  nečistotu (Gini) vo všetkých rozdeleniach všetkých stromov, normalizované na **súčet 1**,
- **L1 regularizácia** (Lasso, logistická regresia s L1) – váhy zbytočných príznakov stlačí **presne na nulu**.

```python
rf = RandomForestClassifier(n_estimators=200, random_state=5)
rf.fit(X, y)
selector = SelectFromModel(rf, threshold='mean', prefit=True)
X_selected = selector.transform(X)
```

- `SelectFromModel` spraví selektor z modelu, ktorý má `feature_importances_` alebo `coef_`: ponechá príznaky
  s dôležitosťou nad `threshold`.
- `threshold='mean'` – priemerná dôležitosť (pri 13 príznakoch 1/13 ≈ 0.077); ďalšie možnosti: číslo (`0.05`),
  `'1.5*mean'`, `'median'`, alebo pevný počet cez `max_features=k`.
- `prefit=True` – model je už natrénovaný, volá sa priamo `transform` (bez `fit`).
- Stromy **nepotrebujú škálovanie** – rozdelenie `chol < 240` funguje v ľubovoľných jednotkách. Preto tu
  škálovač nie je.
- Výsledok cvičenia: najdôležitejšie `cp` 0.147, `thalach` 0.117, `oldpeak` 0.110…; `(303, 13)` → `(303, 7)`:
  `age`, `cp`, `chol`, `thalach`, `oldpeak`, `ca`, `thal`.
- Verzia z Teams: `SelectFromModel(SVC(C=1, kernel='linear'))` + `fit_transform(X, y)` – dôležitosť je `|coef_|`.

### Výber patrí do pipeline

Aby bolo porovnanie „s výberom / bez výberu“ poctivé, výber musí byť **vnútri** krížovej validácie – ako krok
pipeline, ktorý sa zopakuje v každom folde len na trénovacích foldoch. Ak by sme príznaky vybrali na všetkých
dátach a až potom validovali, validačné foldy by už ovplyvnili, ktoré príznaky ostali (**únik informácie**).

```python
pipe_sel = Pipeline([('sel', SelectFromModel(RandomForestClassifier(n_estimators=200, random_state=5),
                                             threshold='mean')),
                     ('clf', RandomForestClassifier(n_estimators=200, random_state=5))])
scores = cross_val_score(pipe_sel, X, y, cv=5, n_jobs=-1)
```

Výsledok: všetky príznaky 0.815 ± 0.039, vybrané 0.775 ± 0.050 (RFECV vnútri CV: 0.812 oproti 0.828) – výber
príznakov presnosť **nemusí zlepšiť**; získame jednoduchší model.

### Prehľad API

| Trieda | Rodina | Potrebuje `y` | Kľúčové parametre | Čo si z nej prečítať |
|---|---|---|---|---|
| `VarianceThreshold` | filter | nie | `threshold` | `get_support()`, `get_feature_names_out()` |
| `SelectKBest` | filter | áno | skórovacia funkcia, `k` | `scores_`, `get_support()` |
| `RFECV` | wrapper | áno | model, `step`, `cv`, `scoring`, `importance_getter` | `n_features_`, `support_`, `ranking_` |
| `SelectFromModel` | embedded | áno | model, `threshold`, `prefit` | `get_support()` |

Všetky sú transformátory: `fit`, `transform`, `fit_transform`.

## Klastrovanie (zhlukovanie)

- **Učenie bez učiteľa** – označenie tried nie je známe (neexistuje *ground truth*). Do učenia bez učiteľa patrí
  klastrovanie a redukcia dimenzionality; učenie s učiteľom je klasifikácia a regresia.
- Klastrovanie hľadá **skupiny podobných objektov** – objekty v skupine sú si podobnejšie ako objekty z iných skupín.
- Použitie: skupiny hudby alebo filmov rovnakého žánru, skupiny zákazníkov s podobným správaním.
- Druhy: založené na **prototypoch** (K-means), na **hustote** (DBSCAN), **hierarchické**.

### K-means

Klastre reprezentujú prototypy:

- **centroid** – priemer (stred) podobných objektov, pre spojité hodnoty,
- **medoid** – najreprezentatívnejší / najčastejšie sa vyskytujúci objekt, pre kategorické hodnoty.

Algoritmus:

1. náhodne vybrať `k` centroidov,
2. prideliť každú vzorku k **najbližšiemu** centroidu,
3. presunúť každý centroid do **stredu (priemeru)** vzoriek, ktoré mu boli priradené,
4. opakovať kroky 2 a 3, kým sa priradenie neprestane meniť, alebo kým nie je splnená zadaná podmienka
   (tolerancia), prípadne maximálny počet iterácií.

- Podobnosť = obrátená hodnota **vzdialenosti** (euklidovská; existujú aj Minkowského, manhattanská…).
- K-means je optimalizačný problém: **minimalizuje sumu štvorcov chýb v rámci klastrov** (SSE, skreslenie,
  *distortion*) – v sklearn `km.inertia_`.
- **Počet klastrov treba zadať vopred** (`n_clusters`).
- Predpokladá **guľaté (konvexné)** klastre; každú vzorku priradí do nejakého klastra (nepozná šum).
- Pracuje so vzdialenosťami → príznaky musia byť **škálované**.
- Výsledok závisí od počiatočných centroidov → `init='k-means++'` (rozmiestni ich ďaleko od seba) a `n_init`.

```python
km = KMeans(n_clusters=3, init='random', n_init=10, max_iter=300, tol=1e-04, random_state=0)
y_km = km.fit_predict(X)
```

| Parameter / atribút | Význam |
|---|---|
| `n_clusters` | počet klastrov K |
| `init` | `'random'` – náhodné centroidy, `'k-means++'` – rozumnejšia inicializácia (predvolená) |
| `n_init=10` | algoritmus beží 10× s rôznymi počiatočnými centroidmi, ostane beh s najmenším SSE |
| `max_iter=300` | maximálny počet iterácií jedného behu |
| `tol=1e-04` | tolerancia zmeny, pri ktorej sa beh vyhlási za skonvergovaný |
| `fit_predict(X)` | natrénuje a vráti číslo klastra každej vzorky (to isté je v `km.labels_`) |
| `km.cluster_centers_` | súradnice centroidov, tvar `(n_clusters, počet príznakov)` |
| `km.inertia_` | skreslenie – SSE vzoriek k ich najbližšiemu centroidu |

### Lakťová metóda (elbow method)

Nepoznáme skutočné triedy, takže K nevieme overiť presnosťou. Lakťová metóda využíva **graf klastrovej SSE**:

```python
distortions = []
for i in range(1, 11):
    km = KMeans(n_clusters=i, random_state=5)
    km.fit(data)
    distortions.append(km.inertia_)
plt.plot(range(1, 11), distortions, marker='o')
```

- Skreslenie s rastúcim K **vždy klesá** (pri K = N je 0) – nehľadáme minimum, ale **lakeť**: K, za ktorým ďalší
  klaster už veľa nepomôže.
- Prednáškový príklad (`make_blobs`, 3 zhluky): 713.7 → 283.5 → **72.5** → 62.9 → 54.3 – lakeť je pri K = 3.
- Keď lakeť nie je ostrý: **silueta** vzorky `s = (b − a) / max(a, b)` ∈ ⟨−1, 1⟩, kde `a` je priemerná vzdialenosť
  k vlastnému klastru a `b` k najbližšiemu cudziemu; vyššia priemerná silueta = kompaktnejšie a lepšie
  oddelené klastre (`silhouette_score`).
- Dve klastrovania porovná **adjusted Rand index** (1 = zhodné, 0 = náhodná zhoda; na číslovaní klastrov nezáleží).

### DBSCAN

*Density-based Spatial Clustering of Applications with Noise.* **Hustota** = počet bodov vo vzdialenosti danej
polomerom ε.

1. Označenie bodov:
   - **hlavný (core) bod** – v polomere ε má aspoň `MinPts` bodov,
   - **hraničný (border) bod** – má menej ako `MinPts` susedov, ale leží do vzdialenosti ε od hlavného bodu,
   - ostatné body sú **šum (noise)**.
2. Vytvoriť klaster pre každý hlavný bod, prípadne pre skupinu hlavných bodov, ak je ich vzdialenosť menšia ako ε.
3. Priradiť hraničné body ku klastrom ich hlavných bodov.

```python
db = DBSCAN(eps=0.2, min_samples=5, metric='euclidean')
y_db = db.fit_predict(X)
```

- `eps` = polomer ε, `min_samples` = MinPts (v sklearn sa počíta aj bod sám).
- Šum má značku **−1**; počet klastrov sa **nezadáva**, vyjde z dát.
- Výhoda: **nepredpokladá guľatý tvar** klastrov (ako K-means), vie označiť odľahlé body ako šum.
- Nevýhody: trpí **kliatbou dimenzionality** (ako všetky algoritmy s euklidovskou vzdialenosťou) a treba správne
  nastaviť **MinPts a ε**.
- Prednáškový príklad `make_moons` (dva polmesiace): K-means ich rozdelí priamkou a časť každého polmesiaca
  zaradí zle; DBSCAN s `eps=0.2` nájde oba (100 + 100 bodov, žiadny šum). Príliš malé ε → všetko je šum, príliš
  veľké ε → jeden klaster.

### K-means a DBSCAN vedľa seba

| | K-means | DBSCAN |
|---|---|---|
| Princíp | prototypy (centroidy) | hustota bodov |
| Počet klastrov | **zadáva sa vopred** | určí sa sám |
| Parametre | `n_clusters` | `eps`, `min_samples` |
| Tvar klastrov | guľaté, konvexné | ľubovoľný (aj polmesiace) |
| Šum / odľahlé body | každý bod má klaster | body mimo hustých oblastí = šum (−1) |
| Čo minimalizuje | SSE v rámci klastrov | nič – spája husté oblasti |
| Slabina | voľba K, inicializácia, neguľaté tvary | voľba ε a MinPts, vysoká dimenzia |

## PCA – analýza hlavných komponentov

- Metóda **učenia bez učiteľa** pre **lineárnu transformáciu** dát; nepoužíva `y`.
- Hľadá **smery maximálneho rozptylu** vo vysokodimenzionálnych dátach a premietne dáta do priestoru s menším
  počtom rozmerov. Je to kompresia dát pri zachovaní čo najväčšej časti informácie.
- Zostrojí transformačnú maticu **W rozmeru d × k**, ktorá mapuje vektor príznakov `x` do nového k-rozmerného
  priestoru; `k < d`, kde `d` je rozmer pôvodného priestoru príznakov.

Postup:

1. štandardizácia dátovej sady,
2. konštrukcia **kovariančnej matice**,
3. rozklad kovariančnej matice na **vlastné vektory a vlastné čísla**,
4. výber `k` vlastných vektorov, ktoré zodpovedajú **najväčším** vlastným číslam,
5. konštrukcia W z vybraných vlastných vektorov,
6. transformácia d-rozmernej dátovej sady do k-rozmerného priestoru.

Dôsledok: **nižší počet príznakov** a **nové príznaky**.

- Hlavné komponenty sú zoradené podľa zachyteného rozptylu (prvý zachytáva najviac) a sú navzájom kolmé.
- PCA je citlivá na mierku → najprv štandardizovať (krok 1).

```python
pca = PCA(n_components=3)
pca.fit(data)
data_reduced = pd.DataFrame(pca.transform(data), columns=["col1", "col2", "col3"])
pca.explained_variance_ratio_      # podiel rozptylu každého komponentu
```

| Atribút | Význam |
|---|---|
| `n_components` | počet ponechaných komponentov; `PCA()` bez parametra ponechá všetky |
| `explained_variance_ratio_` | akú časť celkového rozptylu zachytáva každý komponent (všetky spolu dajú 1) |
| `np.cumsum(...)` z toho | kumulatívna krivka – koľko komponentov treba napr. na 80–90 % rozptylu |
| `components_` | váhy pôvodných príznakov v každom komponente, tvar `(k, d)` – pomáhajú komponent interpretovať |

### PCA a K-means na cvičení (ex_06)

- Dáta `market_research.csv`: 2212 zákazníkov, 23 príznakov, už **štandardizované** (priemer 0, odchýlka 1).
- Lakťová metóda na všetkých 23 príznakoch → K-means s `n_clusters=3`. Vykresliť vieme len 3 z 23 rozmerov
  (`Education`, `Income`, `Age`) – klastre sa na obrázku prekrývajú, hoci v 23-rozmernom priestore sú oddelené.
- `PCA(n_components=3)`: komponenty zachytia 0.385 + 0.129 + 0.061 = **57.5 %** rozptylu; na 80 % by bolo treba
  9 komponentov.
- Lakťová metóda a K-means (K = 3) znova na redukovaných dátach – teraz sa dajú klastre zobraziť v 3D celé.
- Klastre s PCA a bez nej sú takmer rovnaké (ARI 0.965): hlavná štruktúra dát je v prvých komponentoch.
- Prvý komponent ťahajú `Spent`, `Meat`, `Income` – „koľko zákazník nakupuje“.

Na vizualizáciu dát prednáška spomína aj **t-SNE** (`sklearn.manifold.TSNE`).

## Typické pasce

> **Na teste:** jeden nesprávny krížik znamená nula bodov – tieto zámeny sa v otázkach opakujú.

- *Wrapper* = použitie algoritmov strojového učenia (model sa trénuje na podmnožinách). Štatistické testy
  a rozptyl sú *filter*.
- K v K-means je **počet klastrov** a zadáva sa vopred; K-means nie je hierarchická metóda a nefunguje dobre
  na nekonvexných klastroch.
- **Centroid** = stredový bod (priemer) klastra – nie najčastejšia hodnota, nie najvzdialenejší bod.
- **Hustota** v DBSCAN = počet bodov v danom polomere; **ε** = polomer okolia bodu.
- PCA a K-means sú učenie **bez** učiteľa; náhodný les je učenie s učiteľom.
- Skreslenie (`inertia_`) pri väčšom K vždy klesne – najmenšia hodnota neznamená najlepšie K.
- `VarianceThreshold` a PCA závisia od mierky príznakov; náhodný les nie.
- Výber príznakov na všetkých dátach pred krížovou validáciou = únik informácie.

## Rýchle zhrnutie

- Pretrénovanie riešia: viac dát, jednoduchší model, redukcia dimenzionality.
- Výber príznakov ponecháva pôvodné stĺpce; PCA vytvára nové (lineárne kombinácie) a pôvodný význam sa stráca.
- **Filter** = štatistika bez modelu (`VarianceThreshold`, `SelectKBest`), **wrapper** = trénovanie modelu na
  podmnožinách (`RFE`, `RFECV`), **embedded** = dôležitosť z jedného natrénovaného modelu (`SelectFromModel`).
- `VarianceThreshold(threshold=0.05).fit_transform(data)` – bez `y`, závisí od mierky; predvolený prah 0 odstráni
  iba konštantné stĺpce.
- `SelectKBest(f_classif, k=5)` hodnotí každý príznak samostatne; `chi2` chce nezáporné hodnoty.
- `RFECV(clf, step=1, cv=5, scoring='accuracy', importance_getter='named_steps.clf.coef_')` – odstraňuje príznak
  s najmenšou `|váhou|`, počet príznakov vyberie krížová validácia; `ranking_` 1 = vybraný.
- `SelectFromModel(rf, threshold='mean', prefit=True).transform(X)` – ponechá príznaky s nadpriemernou
  dôležitosťou; `feature_importances_` majú súčet 1.
- Výber príznakov patrí do pipeline, aby sa opakoval v každom folde.
- K-means: náhodné centroidy → priradiť k najbližšiemu → presunúť centroid do priemeru → opakovať; minimalizuje
  SSE v rámci klastrov (`inertia_`), K treba zadať, predpokladá guľaté klastre.
- Lakťová metóda: `inertia_` pre K = 1…10, vyberáme zlom krivky; alternatíva je silueta (⟨−1, 1⟩, vyššia = lepšia).
- DBSCAN: hlavný / hraničný bod / šum podľa `eps` a `min_samples`; nezadáva sa počet klastrov, zvláda neguľaté
  tvary, šum má značku −1; trpí kliatbou dimenzionality.
- PCA: štandardizácia → kovariančná matica → vlastné vektory a čísla → k vektorov s najväčšími vlastnými číslami
  → matica W (d × k) → transformácia.
- `PCA(n_components=3)`, `fit`, `transform`, `explained_variance_ratio_` (na cvičení 57.5 % rozptylu z 23 príznakov).
- Po PCA sa K-means správa takmer rovnako (ARI 0.965) a klastre sa dajú vykresliť.
