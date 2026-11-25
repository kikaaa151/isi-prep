# PuzzleState (core/state.py): the board, the link to the parent, equality and hash
class PuzzleState:
    def __init__(self, board, parent=None, moved_tile=None):
        self.board = [row[:] for row in board]  #!
        self.size = len(board)
        self.parent = parent  #!
        self.moved_tile = moved_tile
        self._blank_pos = self._find_blank()

    def _find_blank(self):
        for r in range(self.size):
            for c in range(self.size):
                if self.board[r][c] == 0:  #!
                    return r, c
        raise ValueError("No blank tile (0) found in the board")

    def __eq__(self, other):
        return isinstance(other, PuzzleState) and self.board == other.board  #!

    def __hash__(self):
        return hash(tuple(tuple(row) for row in self.board))  #!
