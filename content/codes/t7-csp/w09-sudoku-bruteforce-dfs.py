# SudokuSolver._bruteforce_dfs (core/solver.py): blind DFS, no validity checks
def _bruteforce_dfs(self, r, c):
    if r == 9:  #!
        return self._check_full_board()  #!
    next_r = r + 1 if c == 8 else r
    next_c = 0 if c == 8 else c + 1
    if self.board.grid[r][c] != 0:
        return self._bruteforce_dfs(next_r, next_c)
    for val in range(1, 10):  #!
        self.board.grid[r][c] = val  #!
        self.expanded += 1
        if self.gui_callback:
            self.gui_callback()
        if self._bruteforce_dfs(next_r, next_c):  #!
            return True
    self.board.grid[r][c] = 0  #!
    return False
