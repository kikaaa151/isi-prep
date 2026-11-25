# core/algorithms.py: random neighbour, a worse one accepted with probability exp(-delta / T)
def simulated_annealing(start_state, t_start=2.0, cooling=0.995, t_min=0.001, max_steps=20_000):
    current = start_state
    history = [current]
    T = t_start  #!
    for _ in range(max_steps):
        if current.is_goal() or T < t_min:  #!
            break
        neighbor = current.random_neighbor()  #!
        delta = neighbor.conflicts() - current.conflicts()  #!
        if delta < 0 or random.random() < math.exp(-delta / T):  #!
            current = neighbor
        history.append(current)  #!
        T = T * cooling  #!
    return current, history
