# core/algorithms.py: Breadth-First Search - FIFO queue, the shortest path
from collections import deque


def bfs(start_state):
    frontier = deque([start_state])  #!
    visited = {start_state}  #!
    discovered = 1
    expanded = 0

    while frontier:
        current_state = frontier.popleft()  #!
        expanded += 1
        if current_state.is_goal():  #!
            return current_state, discovered, expanded

        for tile in current_state.get_possible_moves():
            next_state = current_state.move_tile(tile)  #!
            if next_state not in visited:  #!
                visited.add(next_state)
                frontier.append(next_state)  #!
                discovered += 1

    return None, discovered, expanded
