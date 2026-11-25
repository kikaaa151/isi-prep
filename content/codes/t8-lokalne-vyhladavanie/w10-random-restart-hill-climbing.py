# core/algorithms.py: restart hill climbing from a random board until it succeeds
def random_restart_hill_climbing(start_state, max_restarts=50):
    # first run from the given board
    result, history = hill_climbing(start_state)  #!
    # at most max_restarts runs in total
    for _ in range(max_restarts - 1):  #!
        if result.is_goal():  #!
            break
        result, part = hill_climbing(NQueensState.random(start_state.n))  #!
        history.extend(part)  #!
    return result, history
