**O čo ide:** les nevie povedať len „trieda 0“, ale aj **ako veľmi si je istý** (aký podiel stromov za ňu hlasoval). Overujeme, či je tam, kde si je istý, naozaj presnejší.

### Krok za krokom

1. Začiatok je známy recept: `make_classification` → `train_test_split` → `RandomForestClassifier(random_state=500)` → `fit` → `predict` → `accuracy_score`.
2. `probs = rf.predict_proba(X_test)` – namiesto tried vráti **pravdepodobnosti**. Pre každú vzorku dve čísla: podiel stromov za triedu 0 a za triedu 1. Spolu dajú vždy 1.
3. `probs = np.around(probs, 1)` – zaokrúhli na jedno desatinné miesto (0.0, 0.1, …, 1.0), aby vzniklo len 11 skupín.
4. `probs_df = pd.DataFrame(probs, columns=['0', '1'])` – spraví z toho tabuľku so stĺpcami `'0'` a `'1'`.
5. `probs_df['was_correct'] = y_predict == y_test` – pridá stĺpec `True`/`False`: trafil sa model pri tejto vzorke?
6. `probs_df.groupby('0').was_correct.agg(['mean', 'count'])` – zoskupí vzorky podľa pravdepodobnosti triedy 0 a v každej skupine vypočíta `mean` (presnosť) a `count` (koľko vzoriek tam je).
7. `bins['mean'].plot(kind='bar', ax=ax)` – stĺpcový graf presnosti pre každú skupinu.

### Čo z toho vidno

- Pri pravdepodobnosti blízko `0.0` alebo `1.0` (stromy sa zhodnú) je presnosť takmer 100 %.
- Okolo `0.5` (stromy sú rozdelené pol na pol) model háda – presnosť je nízka.

### Ako si to zapamätať

- `predict` → trieda. `predict_proba` → pravdepodobnosti, jeden stĺpec na triedu.
- `groupby(stĺpec).iný_stĺpec.agg([...])` = „rozdeľ do skupín a v každej niečo spočítaj“.
