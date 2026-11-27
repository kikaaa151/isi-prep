**O čo ide:** načítame hotový dataset ručne písaných číslic zo scikit-learn a nakreslíme si ich. Učíme sa, ako vyzerajú dáta: `X` sú príznaky, `y` sú správne odpovede.

### Krok za krokom

1. `digits = datasets.load_digits()` – načíta dataset, ktorý je priamo súčasťou knižnice (nič sa nesťahuje). Je v ňom 1797 obrázkov číslic 8 × 8 bodov.
2. `X = digits.data` – tabuľka príznakov. Každý obrázok je „rozbalený“ do jedného riadku so 64 číslami (8 × 8), preto tvar `(1797, 64)`.
3. `y = digits.target` – pre každý obrázok správna číslica (0 až 9), tvar `(1797,)`.
4. `digits.images[idx]` – ten istý obrázok, ale ešte ako mriežka 8 × 8. Tú vie nakresliť `plt.imshow(...)`.
5. `cmap=plt.cm.gray_r` – odtiene sivej naopak (`_r` = reversed): vysoké číslo = tmavý bod, takže číslica je čierna na bielom.
6. `plt.title(f"label = {y[idx]}")` – do nadpisu dáme správnu odpoveď. `plt.show()` obrázok zobrazí.
7. `fig, axes = plt.subplots(2, 5, ...)` – pripraví mriežku 2 × 5 malých grafov. `axes` je tabuľka 2 × 5.
8. `zip(axes.ravel(), digits.images, y)` – `ravel()` urobí z tabuľky grafov jeden rad 10 grafov a `zip` ku každému pripojí obrázok a jeho číslicu. Cyklus teda skončí po 10 obrázkoch.
9. `ax.axis("off")` – schová osi, aby nerušili.

### Ako si to zapamätať

- Každý dataset zo scikit-learn má `.data` (príznaky, `X`) a `.target` (odpovede, `y`).
- Model sa učí zo `64` čísel v riadku, človek sa pozerá na `images` 8 × 8.
- Kreslenie: `imshow` → `title` → `show`. Viac grafov naraz: `subplots` + cyklus cez `axes.ravel()`.
