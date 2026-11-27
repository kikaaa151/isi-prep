**O čo ide:** 23 príznakov je veľa – nedajú sa nakresliť a časť z nich hovorí to isté. **PCA** ich „stlačí“ do 3 nových príznakov (komponentov) tak, aby sa stratilo čo najmenej informácie. Na stlačených dátach potom spravíme K-means.

Komponent nie je žiadny z pôvodných stĺpcov – je to ich zmes. Prvý komponent zachytáva najviac rozdielov v dátach, druhý menej, a tak ďalej.

### Krok za krokom

1. `data = pd.read_csv('market_research.csv')` – tie isté dáta zákazníkov.
2. **Koľko komponentov treba?**
    - `pca_full = PCA().fit(data)` – PCA bez obmedzenia: spočíta všetkých 23 komponentov,
    - `pca_full.explained_variance_ratio_` – aký podiel informácie (rozptylu) nesie každý komponent; spolu 1,
    - `cumulative = np.cumsum(...)` – postupný súčet: koľko nesie prvý, prvé dva, prvé tri…
    - `np.argmax(cumulative >= 0.8) + 1` – prvé miesto, kde súčet dosiahne 80 %. Vyjde 9 komponentov. (`+ 1`, lebo indexy idú od nuly.)
3. `pca = PCA(n_components=3)` – my chceme len 3, aby sa dali nakresliť v 3D.
4. `pca.fit(data)` – PCA nájde tri smery, v ktorých sa dáta najviac líšia. Bez `y`.
5. `pca.transform(data)` – prepočíta každého zákazníka na 3 nové čísla. Zabalíme to do tabuľky: `pd.DataFrame(..., columns=["col1", "col2", "col3"])`.
6. `pca.explained_variance_ratio_` → `[0.385 0.129 0.061]`, spolu `0.575`: tri komponenty zachovali 57,5 % informácie z pôvodných 23 stĺpcov.
7. `km = KMeans(n_clusters=3, random_state=5)` a `y_km = km.fit_predict(data_reduced)` – klastrovanie, tentoraz na zmenšených dátach.
8. `np.bincount(y_km)` → `[511 1077 624]` – skoro rovnaké skupiny ako bez PCA. Stlačenie teda podstatné rozdiely zachovalo.

### Ako si to zapamätať

- Tri riadky PCA: `PCA(n_components=3)` → `fit(data)` → `transform(data)`.
- `explained_variance_ratio_` = koľko informácie ostalo. Sčítaj to a máš percento.
- PCA nevyberá stĺpce (ako výber príznakov), ale **vyrába nové** kombináciou starých.
