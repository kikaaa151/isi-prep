# SudokuSolver._dfs (core/solver.py): recursive backtracking, optional MRV / LCV
def _dfs(self, use_mrv, use_lcv):
    if use_mrv:
        cell, domain = self.select_unassigned_mrv()
    else:
        cell = self.board.find_empty()
    if cell is None:  #!
        return True
    r, c = cell
    if not use_mrv:
        domain = self.board.get_domain(r, c)  #!
    if use_lcv:
        domain = self.sort_values_lcv(r, c, domain)
    for val in domain:  #!
        self.board.grid[r][c] = val  #!
        self.expanded += 1
        if self.gui_callback:
            self.gui_callback()
        if self._dfs(use_mrv, use_lcv):  #!
            return True
        self.board.grid[r][c] = 0  #!
    return False  #!
