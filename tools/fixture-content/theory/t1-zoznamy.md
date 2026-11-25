# Zoznamy a cykly

Vymyslená téma na vývoj aplikácie – nie je súčasťou predmetu.

## Zoznam

Zoznam (`list`) je **meniteľná** usporiadaná postupnosť. Indexuje sa od nuly.

| Operácia | Zápis | Zložitosť |
|---|---|---|
| pridanie na koniec | `xs.append(x)` | O(1) |
| vloženie na začiatok | `xs.insert(0, x)` | O(n) |
| dĺžka | `len(xs)` | O(1) |

> **Pozor:** `xs[1:3]` vracia prvky s indexom 1 a 2, horná hranica sa nezapočíta.

### Rezy

Rez `xs[a:b:k]` vytvára **nový** zoznam. Záporný krok obracia poradie:

```python
xs = [1, 2, 3, 4]
print(xs[::-1])  # [4, 3, 2, 1]
```

## Cyklus for

1. `for x in xs` prechádza prvky.
2. `for i, x in enumerate(xs)` dáva aj index.
3. `range(n)` generuje čísla 0 až n − 1.

Viac v [dokumentácii Pythonu](https://docs.python.org/3/tutorial/).

## Rýchle zhrnutie

- Zoznam je meniteľný, n-tica nie.
- Indexy začínajú nulou, `xs[-1]` je posledný prvok.
- Rez nezahŕňa hornú hranicu.
- `append` je O(1), `insert(0, x)` je O(n).
- `range(n)` končí číslom n − 1.
- `enumerate` vracia dvojice (index, prvok).
- Rez vytvára kópiu, priradenie `ys = xs` nie.
- `len(xs)` je O(1).
