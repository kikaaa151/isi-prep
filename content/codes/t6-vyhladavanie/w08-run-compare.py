# Run all four algorithms without the GUI (what run_algorithm in gui/visualizer.py does)
from core.state import PuzzleState
from core.algorithms import bfs, dfs, greedy, astar

start = PuzzleState([[1, 6, 5], [3, 2, 8], [4, 7, 0]])  #!
h = lambda s: s.manhattan_distance()  #!

for name, func, heuristic in [("BFS", bfs, None), ("DFS", dfs, None),
                              ("Greedy", greedy, h), ("A*", astar, h)]:
    if heuristic:
        goal_state, discovered, expanded = func(start, heuristic)  #!
    else:
        goal_state, discovered, expanded = func(start)  #!
    path = goal_state.reconstruct_path()  #!
    print(name, len(path), discovered, expanded)
