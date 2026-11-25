# NQueensState.best_neighbor (core/state.py): neighbour with the lowest h, ties at random
def best_neighbor(self):
    n, h = self.n, self.conflicts()
    rows, diag, anti = self._line_counts()
    best_value, best_moves = None, []
    for c, old_r in enumerate(self.queens):
        # h without the attacks on the old square of this queen
        base = h - (rows[old_r] - 1) - (diag[old_r - c + n - 1] - 1) - (anti[old_r + c] - 1)  #!
        for r in range(n):
            if r == old_r:
                continue
            value = base + rows[r] + diag[r - c + n - 1] + anti[r + c]  #!
            if best_value is None or value < best_value:  #!
                best_value, best_moves = value, [(c, r)]  #!
            elif value == best_value:
                best_moves.append((c, r))  #!
    c, r = random.choice(best_moves)  #!
    return self.move_queen(c, r)
