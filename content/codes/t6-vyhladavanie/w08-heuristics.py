# PuzzleState heuristics (core/state.py): h1 = misplaced tiles, h2 = Manhattan distance
def count_misplaced_tiles(self):
    expected = list(range(1, self.size ** 2)) + [0]
    flat = [num for row in self.board for num in row]
    return sum(1 for i in range(len(flat)) if flat[i] != 0 and flat[i] != expected[i])  #!


def manhattan_distance(self):
    distance = 0
    for r in range(self.size):
        for c in range(self.size):
            val = self.board[r][c]
            if val != 0:  #!
                goal_r = (val - 1) // self.size  #!
                goal_c = (val - 1) % self.size  #!
                distance += abs(goal_r - r) + abs(goal_c - c)  #!
    return distance
