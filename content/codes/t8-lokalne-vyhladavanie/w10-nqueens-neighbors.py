# NQueensState (core/state.py): a neighbour = one queen moved inside its column
def move_queen(self, col, row):
    new_queens = list(self.queens)
    new_queens[col] = row  #!
    return NQueensState(new_queens)  #!

def neighbors(self):
    return [self.move_queen(col, row)  #!
            for col in range(self.n)
            for row in range(self.n)
            if row != self.queens[col]]  #!

def random_neighbor(self):
    col = random.randrange(self.n)  #!
    row = random.randrange(self.n - 1)  #!
    if row >= self.queens[col]:  #!
        row += 1
    return self.move_queen(col, row)
