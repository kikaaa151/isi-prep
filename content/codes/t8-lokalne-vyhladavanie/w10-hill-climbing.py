# core/algorithms.py: steepest-descent hill climbing (h = conflicts is minimised)
def hill_climbing(start_state, max_steps=1000):
    current = start_state
    history = [current]
    for _ in range(max_steps):
        if current.is_goal():  #!
            break
        neighbor = current.best_neighbor()  #!
        if neighbor.conflicts() >= current.conflicts():  #!
            break  #!
        current = neighbor  #!
        history.append(current)
    return current, history  #!
