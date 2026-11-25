# NQueensState (core/state.py): h = number of pairs of queens that attack each other
def conflicts(self):
    if self._conflicts is None:
        rows, diag, anti = self._line_counts()  #!
        self._conflicts = sum(k * (k - 1) // 2  #!
                              for counts in (rows, diag, anti)  #!
                              for k in counts)
    return self._conflicts

def _line_counts(self):
    n = self.n
    rows, diag, anti = [0] * n, [0] * (2 * n - 1), [0] * (2 * n - 1)
    for c, r in enumerate(self.queens):  #!
        rows[r] += 1  #!
        diag[r - c + n - 1] += 1  #!
        anti[r + c] += 1  #!
    return rows, diag, anti
