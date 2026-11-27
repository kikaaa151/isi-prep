**O čo ide:** chceme **vidieť**, kde SVM vedie hranicu medzi dvoma triedami. Trik: pokryjeme rovinu mriežkou bodov, pri každom sa modelu opýtame „aká trieda?“ a bod podľa odpovede zafarbíme.

### Krok za krokom

1. `datasets.make_blobs(n_features=2, centers=2, random_state=1)` – vyrobí dva zhluky bodov v rovine (2 príznaky = súradnice x a y, 2 stredy = 2 triedy).
2. `svm = SVC(kernel='linear')` a `svm.fit(X, y)` – model sa naučí na **všetkých** bodoch. Tu nič nemeriame, len kreslíme, preto žiadne rozdelenie na train/test.
3. `Point = namedtuple('Point', ['x', 'y', 'outcome'])` – malá „krabička“ na tri hodnoty: súradnice bodu a predikovanú triedu.
4. `np.percentile(X[:, 0], [0, 100])` – 0. a 100. percentil = najmenšia a najväčšia hodnota. `X[:, 0]` je prvý stĺpec (súradnica x), `X[:, 1]` druhý (y).
5. `np.linspace(xmin - 2.5, xmax + 2.5, 20)` – 20 rovnomerne rozložených hodnôt od–do. `product(...)` z dvoch takýchto radov spraví 20 × 20 = 400 bodov mriežky.
6. `svm.predict(np.array([xpt, ypt]).reshape(1, -1))` – `predict` chce tabuľku (riadky = vzorky). Jeden bod preto pretvarujeme na tabuľku s 1 riadkom a 2 stĺpcami. Výsledok je pole s jedným číslom (trieda 0 alebo 1).
7. `ax.scatter(xpt, ypt, color=colors[pt[0]], alpha=.15)` – bod mriežky nakreslíme bledo, farbou podľa triedy (`pt[0]` je to jedno číslo z poľa). Vzniknú dve farebné oblasti a medzi nimi je hranica.
8. `ax.scatter(X[:, 0], X[:, 1], color=colors[y], s=30)` – navrch výrazne dokreslíme skutočné dáta.

### Ako si to zapamätať

- Postup: nauč model → vyrob mriežku → `predict` pre každý bod → zafarbi.
- `reshape(1, -1)` = „jedna vzorka, stĺpcov koľko treba“. Treba ho vždy, keď predikuješ jediný bod.
- `colors[y]` – pole farieb indexované triedami: trieda 0 → `'r'`, trieda 1 → `'b'`.
