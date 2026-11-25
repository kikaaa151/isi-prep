def sum_even(numbers):
    total = 0
    for x in numbers:  #!
        if x % 2 == 0:  #!
            total += x  #!
    return total


data = [1, 2, 3, 4, 5, 6]
# vypise 12
print(sum_even(data))
