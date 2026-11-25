# PuzzleState.is_goal / reconstruct_path (core/state.py): goal test and the solution
def is_goal(self):
    expected = list(range(1, self.size ** 2)) + [0]  #!
    flat = [num for row in self.board for num in row]  #!
    return flat == expected


def reconstruct_path(self):
    path = []
    state = self
    while state.parent is not None:  #!
        path.append(state.moved_tile)  #!
        state = state.parent  #!
    return list(reversed(path))  #!
