# SudokuBoard.is_valid (core/board.py): may val be placed at (r, c)?
def is_valid(self, r, c, val):
    if val in self.grid[r]:  #!
        return False
    for i in range(9):
        if self.grid[i][c] == val:  #!
            return False
    block_row = (r // 3) * 3  #!
    block_col = (c // 3) * 3  #!
    for i in range(block_row, block_row + 3):  #!
        for j in range(block_col, block_col + 3):
            if self.grid[i][j] == val:  #!
                return False
    return True
