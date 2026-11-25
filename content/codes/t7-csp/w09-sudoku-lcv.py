# SudokuSolver.sort_values_lcv (core/solver.py): Least Constraining Value
def sort_values_lcv(self, r, c, domain):
    # 1) peers = cells of the same row, column and 3x3 block
    peers = set()
    for i in range(9):
        if i != c:
            peers.add((r, i))  #!
        if i != r:
            peers.add((i, c))  #!
    block_r = (r // 3) * 3
    block_c = (c // 3) * 3
    for rr in range(block_r, block_r + 3):
        for cc in range(block_c, block_c + 3):
            if (rr, cc) != (r, c):
                peers.add((rr, cc))  #!
    # 2) score of every value
    value_scores = {}
    for val in domain:
        score = 0
        for (rr, cc) in peers:
            if self.board.grid[rr][cc] != 0:  #!
                continue
            if not self.board.is_valid(rr, cc, val):  #!
                score += 1
        value_scores[val] = score  #!
    # 3) lowest score first
    return sorted(domain, key=lambda v: value_scores[v])  #!
