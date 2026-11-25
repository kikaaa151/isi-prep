# SudokuBoard.find_empty (core/board.py)
# returns (r, c) of the first empty cell, scanned row by row;
# returns None when the board is full (= puzzle solved)
def find_empty(self):
    for r in range(9):  #!
        for c in range(9):
            if self.grid[r][c] == 0:  #!
                # first unassigned variable
                return r, c  #!
    # no empty cell
    return None  #!
