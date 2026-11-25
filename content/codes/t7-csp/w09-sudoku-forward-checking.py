# SudokuSolver._fc (core/solver.py): backtracking + forward checking
def _fc(self, use_mrv, use_lcv):
    if use_mrv:
        cell, domain = self.select_unassigned_mrv()
    else:
        cell = self.board.find_empty()
    if cell is None:
        return True
    r, c = cell
    if not use_mrv:
        domain = self.board.get_domain(r, c)
    if use_lcv:
        domain = self.sort_values_lcv(r, c, domain)
    for val in domain:
        self.board.grid[r][c] = val  #!
        self.expanded += 1
        if self.gui_callback:
            self.gui_callback()
        # forward check: every empty cell must keep at least one legal value
        ok = all(self.board.get_domain(rr, cc)  #!
                 for rr in range(9) for cc in range(9)  #!
                 if self.board.grid[rr][cc] == 0)  #!
        if ok and self._fc(use_mrv, use_lcv):  #!
            return True
        self.board.grid[r][c] = 0  #!
    return False
