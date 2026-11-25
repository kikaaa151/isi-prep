# core/algorithms.py: Depth-First Search - LIFO stack, with an expansion limit
def dfs(start_state, limit=50_000):
    stack = [start_state]  #!
    visited = {start_state}
    discovered = 1
    expanded = 0

    while stack:
        if expanded >= limit:  #!
            return None, discovered, expanded
        current_state = stack.pop()  #!
        expanded += 1
        if current_state.is_goal():
            return current_state, discovered, expanded

        for tile in current_state.get_possible_moves():
            next_state = current_state.move_tile(tile)
            if next_state not in visited:  #!
                visited.add(next_state)  #!
                stack.append(next_state)  #!
                discovered += 1

    return None, discovered, expanded
