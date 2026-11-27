**O čo ide:** stĺpec `sex` obsahuje **slová** `female` a `male`. Modely počítajú len s číslami, preto slová prekódujeme na čísla 0 a 1. Robí to `LabelEncoder`.

### Krok za krokom

1. Prvá časť (načítanie, `drop`, doplnenie veku priemerom) je rovnaká ako v predchádzajúcom kóde – Titanic sa buduje postupne.
2. `enc = LabelEncoder()` – vytvorí kódovač. Zatiaľ nepozná žiadne slová.
3. `enc.fit(titanic_reduced["sex"])` – kódovač si prejde stĺpec a **zapamätá** si, aké rôzne hodnoty v ňom sú. Zoradí ich podľa abecedy a očísluje od nuly.
4. `enc.classes_` – čo si zapamätal: `['female' 'male']`. Poradie je zároveň kód: `female` → 0, `male` → 1.
5. `titanic_reduced["sex"] = enc.transform(titanic_reduced["sex"])` – slová **nahradí** číslami a výsledok uloží späť do toho istého stĺpca.
6. Výpis cestujúceho 12 pred a po: `sex female` sa zmení na `sex 0`.

### Ako si to zapamätať

- Vzor **`fit` → `transform`** je všade v scikit-learn: `fit` sa niečo naučí (tu zoznam slov), `transform` to použije.
- `classes_` – podčiarkovník na konci znamená „toto vzniklo až po `fit`“.
- `LabelEncoder` je vhodný, keď sú hodnoty len dve (ako tu). Pri troch a viac kategóriách bez poradia treba one-hot kódovanie – to je ďalší kód.
