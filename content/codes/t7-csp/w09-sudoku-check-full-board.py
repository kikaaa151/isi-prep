# SudokuSolver._check_full_board (core/solver.py): goal test of a full board
def _check_full_board(self):
    for i in range(9):
        row = self.board.grid[i]
        col = [self.board.grid[r][i] for r in range(9)]  #!
        if len(set(row)) != 9:  #!
            return False
        if len(set(col)) != 9:
            return False
    for br in range(0, 9, 3):  #!
        for bc in range(0, 9, 3):
            block = []
            for r in range(br, br + 3):
                for c in range(bc, bc + 3):
                    block.append(self.board.grid[r][c])  #!
            if len(set(block)) != 9:  #!
                return False
    return True
