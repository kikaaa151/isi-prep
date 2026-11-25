# core/algorithms.py: Greedy best-first search - priority = h(n) only
import heapq


def greedy(start_state, heuristic):
    state_id = 0
    open_list = [(heuristic(start_state), state_id, start_state)]  #!
    in_open = {start_state}
    closed_list = set()
    discovered = 1
    expanded = 0

    while open_list:
        _, _id, current = heapq.heappop(open_list)  #!
        in_open.remove(current)
        expanded += 1
        if current.is_goal():
            return current, discovered, expanded
        closed_list.add(current)  #!

        for tile in current.get_possible_moves():
            neighbor = current.move_tile(tile)
            if neighbor in closed_list:  #!
                continue
            if neighbor not in in_open:  #!
                state_id += 1
                heapq.heappush(open_list, (heuristic(neighbor), state_id, neighbor))  #!
                in_open.add(neighbor)
                discovered += 1

    return None, discovered, expanded
