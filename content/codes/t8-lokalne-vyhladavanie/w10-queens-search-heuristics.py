# QueensSearchState (core/search_state.py): heuristics of A* on N-Queens
def _attacking_pairs(self):
    if self._pairs is None:
        q = self.queens
        self._pairs = [(c1, c2) for c1 in range(self.n) for c2 in range(c1 + 1, self.n)  #!
                       if q[c1] == q[c2] or abs(q[c1] - q[c2]) == c2 - c1]  #!
    return self._pairs

# h1: number of attacking pairs - NOT admissible
def conflicts(self):
    return len(self._attacking_pairs())  #!

# h2: attacking pairs that share no queen - admissible lower bound
def min_moves_lower_bound(self):
    used = set()
    bound = 0
    for c1, c2 in self._attacking_pairs():
        if c1 not in used and c2 not in used:  #!
            used.update((c1, c2))  #!
            bound += 1  #!
    return bound
