import numpy as np

print("Inteligentne systemy v informatike")

# 0..14 as a matrix with 3 rows and 5 columns
a = np.arange(15).reshape(3, 5)  #!

print(f"Shape: {a.shape}")  #!
print(f"Size: {a.size}")  #!
print(a)
print(a.sum())  #!
print(a.sum(1))  #!
print(a.sum(0))  #!
