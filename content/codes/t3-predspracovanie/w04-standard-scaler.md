**O čo ide:** príznaky vína majú rôzne veľké čísla (jeden okolo 13, iný okolo 2). Štandardizácia ich prepočíta tak, aby mal každý **priemer 0 a smerodajnú odchýlku 1**. Žiadny príznak potom „neprekričí“ ostatné.

Vzorec: `nová hodnota = (hodnota − priemer) / odchýlka`.

### Krok za krokom

1. `wine = datasets.load_wine()` a `X, y = wine.data, wine.target` – načíta dataset vín.
2. `X[:, :3]` – všetky riadky, **prvé tri stĺpce** (príznaky 0, 1, 2). Pracujeme len s nimi.
3. `X[:, :3].mean(axis=0)` a `.std(axis=0)` – priemer a odchýlka **každého stĺpca** zvlášť (`axis=0` = počítaj po stĺpcoch). Pred škálovaním: priemery `13.0, 2.3, 2.4`.
4. `my_scaler = preprocessing.StandardScaler()` – vytvorí škálovač.
5. `my_scaler.fit(X[:, :3])` – škálovač si **zistí a zapamätá** priemer a odchýlku každého stĺpca. Dáta ešte nemení.
6. `X2 = my_scaler.transform(X[:, :3])` – teraz ich **prepočíta** podľa vzorca. Výsledok je nové pole `X2`.
7. `X2.mean(axis=0)` → prakticky `0`, `X2.std(axis=0)` → `1`. Tým overíme, že škálovanie zafungovalo.
8. `axes[0].boxplot(X[:, :3])` a `axes[1].boxplot(X2)` – dva grafy vedľa seba: pred škálovaním sú krabice v rôznych výškach, po ňom sú zarovnané okolo nuly.

### Ako si to zapamätať

- Tri riadky: `StandardScaler()` → `fit` → `transform`. (Dá sa aj naraz: `fit_transform`.)
- `fit` = nauč sa čísla, `transform` = použi ich.
- Po štandardizácii: priemer 0, odchýlka 1 – to je kontrolná otázka z testu.
