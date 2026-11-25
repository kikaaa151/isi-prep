# core/algorithms.py: A* search - priority f(n) = g(n) + h(n)
import heapq


def astar(start_state, heuristic):
    state_id = 0
    open_list = [(heuristic(start_state), state_id, start_state)]  #!
    closed_list = set()
    g = {start_state: 0}  #!
    discovered = 1
    expanded = 0

    while open_list:
        _, _id, current = heapq.heappop(open_list)  #!
        if current in closed_list:
            continue
        expanded += 1
        if current.is_goal():
            return current, discovered, expanded
        closed_list.add(current)

        for tile in current.get_possible_moves():
            neighbor = current.move_tile(tile)
            if neighbor in closed_list:
                continue
            tentative_g = g[current] + 1  #!
            if tentative_g < g.get(neighbor, float("inf")):  #!
                if neighbor not in g:
                    discovered += 1
                g[neighbor] = tentative_g  #!
                state_id += 1
                heapq.heappush(open_list, (tentative_g + heuristic(neighbor), state_id, neighbor))  #!

    return None, discovered, expanded
