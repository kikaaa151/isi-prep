**O čo ide:** trieda cestujúceho (`pclass`) má tri hodnoty: `1st`, `2nd`, `3rd`. Keby sme ich zakódovali ako 0, 1, 2, model by si myslel, že 3. trieda je „dvakrát viac“ než 2. Preto z jedného stĺpca spravíme **tri stĺpce s nulami a jednotkou** – one-hot kódovanie.

Príklad: cestujúci v 1. triede dostane `class 1 = 1`, `class 2 = 0`, `class 3 = 0`.

### Krok za krokom

1. Začiatok je známy: načítanie, `drop`, doplnenie veku, `LabelEncoder` na `sex`.
2. **Najprv na čísla:** `label_encoder = enc.fit(titanic_reduced["pclass"])` a `transform` – ten istý kódovač sa naučí nové hodnoty a zmení `1st/2nd/3rd` na `0/1/2`.
3. `ohe = OneHotEncoder()` – vytvorí one-hot kódovač.
4. `np.array(titanic_reduced["pclass"]).reshape(-1, 1)` – kódovač chce **tabuľku**, nie rad čísel. `reshape(-1, 1)` spraví z radu tabuľku s jedným stĺpcom (`-1` = riadkov koľko treba).
5. `one_hot_encoder = ohe.fit(pclass_reshaped)` – kódovač zistí, že existujú tri hodnoty.
6. `ohe_coded = ohe.transform(pclass_reshaped).toarray()` – vyrobí tabuľku s tromi stĺpcami núl a jednotiek. `transform` vracia úsporný „riedky“ formát, `.toarray()` z neho spraví obyčajné pole.
7. `titanic_reduced.drop(columns=["pclass"])` – pôvodný stĺpec už netreba, zahodíme ho.
8. `titanic_reduced["class 1"] = ohe_coded[:, 0]` (a podobne `class 2`, `class 3`) – `[:, 0]` je prvý stĺpec tabuľky; pridáme ho ako nový stĺpec.

### Ako si to zapamätať

- One-hot = toľko nových stĺpcov, koľko je kategórií; v každom riadku je práve jedna jednotka.
- Štyri riadky kódovača: `OneHotEncoder()` → `reshape(-1, 1)` → `fit` → `transform(...).toarray()`.
- Potom: zahoď starý stĺpec, pridaj tri nové.
