# PuzzleState.get_possible_moves / move_tile (core/state.py): the successor function
def get_possible_moves(self):
    r, c = self._blank_pos
    moves = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:  #!
        nr, nc = r + dr, c + dc
        if 0 <= nr < self.size and 0 <= nc < self.size:  #!
            moves.append(self.board[nr][nc])  #!
    return moves


def move_tile(self, tile):
    r, c = self._blank_pos
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < self.size and 0 <= nc < self.size and self.board[nr][nc] == tile:
            new_board = [row[:] for row in self.board]  #!
            new_board[r][c], new_board[nr][nc] = new_board[nr][nc], new_board[r][c]  #!
            return PuzzleState(new_board, parent=self, moved_tile=tile)  #!
    raise ValueError(f"Tile {tile} cannot move into blank position")
