# SudokuBoard.get_domain (core/board.py): legal values of the cell (r, c)
def get_domain(self, r, c):
    # a filled cell is not a variable any more
    if self.grid[r][c] != 0:  #!
        return []  #!
    domain = []
    for v in range(1, 10):  #!
        if self.is_valid(r, c, v):  #!
            domain.append(v)
    return domain
