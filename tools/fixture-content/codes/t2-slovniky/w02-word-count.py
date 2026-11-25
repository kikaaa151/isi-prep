text = "ano nie ano mozno ano"
counts = {}
for word in text.split():  #!
    counts[word] = counts.get(word, 0) + 1  #!

ordered = sorted(counts.items(),
                 key=lambda pair: pair[1],
                 reverse=True)  #!
for word, n in ordered:
    print(f"{word}: {n}")
