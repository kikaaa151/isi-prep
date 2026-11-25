# core/algorithms.py: elitism + tournament selection + crossover + mutation
def genetic_algorithm(start_state, population_size=100, generations=1000, mutation_rate=0.5, elite=2):
    n = start_state.n
    population = [start_state] + [NQueensState.random(n) for _ in range(population_size - 1)]  #!
    history = []
    for _ in range(generations):
        population.sort(key=lambda s: s.conflicts())  #!
        history.append(population[0])
        if population[0].is_goal():
            break
        new_population = population[:elite]  #!
        while len(new_population) < population_size:
            parent1 = tournament_selection(population)  #!
            parent2 = tournament_selection(population)
            child = parent1.crossover(parent2)  #!
            if random.random() < mutation_rate:  #!
                child = child.mutate()  #!
            new_population.append(child)
        population = new_population  #!
    return min(population, key=lambda s: s.conflicts()), history
