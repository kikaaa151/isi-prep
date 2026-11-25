# core/state.py: genetic operators (a board = chromosome, one gene per column)
def crossover(self, other):
    cut = random.randint(1, self.n - 1)  #!
    return NQueensState(self.queens[:cut] + other.queens[cut:])  #!

def mutate(self):
    return self.random_neighbor()  #!

# module-level function, not a method
def tournament_selection(population, k=3):
    return min(random.sample(population, k), key=lambda s: s.conflicts())  #!
