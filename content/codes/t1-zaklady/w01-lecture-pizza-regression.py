import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

# Training data
X = [[6], [8], [10], [14], [18]]  #!
y = [[7], [9], [13], [17.5], [18]]  #!

plt.figure()
plt.title('Pizza price plotted against diameter')
plt.xlabel('Diameter in inches')
plt.ylabel('Price in dollars')
plt.plot(X, y, 'k.', markersize=15)
plt.axis([0, 25, 0, 25])
plt.grid(True)
plt.show()

# Create and fit the model
model = LinearRegression()  #!
model.fit(X, y)  #!

predikovana_cena = model.predict(np.array([12]).reshape(-1, 1))  #!
print('A 12" pizza should cost: $%.2f' % predikovana_cena[0][0])  #!
