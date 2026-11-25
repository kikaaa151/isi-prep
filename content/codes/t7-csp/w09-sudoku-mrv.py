# SudokuSolver.select_unassigned_mrv (core/solver.py): Minimum Remaining Values
def select_unassigned_mrv(self):
    best_cell = None
    best_domain = None
    for r in range(9):
        for c in range(9):
            if self.board.grid[r][c] == 0:  #!
                domain = self.board.get_domain(r, c)  #!
                if best_cell is None or len(domain) < len(best_domain):  #!
                    best_cell = (r, c)  #!
                    best_domain = domain
    return best_cell, best_domain  #!
