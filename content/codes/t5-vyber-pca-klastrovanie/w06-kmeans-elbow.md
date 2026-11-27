**O čo ide:** klastrovanie = rozdeliť zákazníkov do skupín podobných ľudí, **bez toho, aby sme mali správne odpovede** (žiadne `y` – učenie bez učiteľa). K-means potrebuje vopred vedieť počet skupín, tak ho najprv odhadneme lakťovou metódou.

Ako funguje K-means: zvolí K stredov (centroidov) → každý bod priradí k najbližšiemu stredu → stredy posunie do priemeru svojich bodov → opakuje, kým sa niečo mení.

### Krok za krokom

1. `data = pd.read_csv('market_research.csv')` – 2212 zákazníkov, 23 príznakov (už štandardizovaných).
2. `distortions = []` – zoznam, kam si budeme zapisovať „skreslenie“ pre každý počet zhlukov.
3. `for i in range(1, 11):` – skúšame 1 až 10 zhlukov. V každom kole:
    - `km = KMeans(n_clusters=i, random_state=5)` – K-means s `i` zhlukmi,
    - `km.fit(data)` – nájde zhluky. Dostane **len dáta**, žiadne `y`,
    - `distortions.append(km.inertia_)` – `inertia_` = súčet štvorcov vzdialeností bodov od ich stredu. Čím menšie, tým sú zhluky tesnejšie.
4. `plt.plot(range(1, 11), distortions, marker='o')` – graf: na osi x počet zhlukov, na osi y skreslenie. Krivka stále klesá (viac zhlukov = vždy menšie skreslenie), ale v jednom mieste sa **zalomí ako lakeť** – odtiaľ už pridávanie zhlukov pomáha málo. To je dobrý počet.
5. `km = KMeans(n_clusters=3, random_state=5)` – lakeť vyšiel pri 3, tak klastrujeme na 3 zhluky.
6. `y_km = km.fit_predict(data)` – nájde zhluky a rovno vráti **číslo zhluku pre každého zákazníka** (0, 1 alebo 2).
7. `np.bincount(y_km)` – koľko zákazníkov je v ktorom zhluku: `[509 1075 628]`.

### Ako si to zapamätať

- Lakťová metóda: cyklus `1..10` → `KMeans(n_clusters=i)` → `fit` → `inertia_` do zoznamu → graf.
- `fit` len nájde zhluky; `fit_predict` ich nájde a vráti označenia.
- Klastrovanie nemá `y` – čísla zhlukov sú len mená skupín, nie „správne odpovede“.
