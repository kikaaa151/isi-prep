import numpy as np
from sklearn import datasets
from sklearn import ensemble
from sklearn import linear_model
from sklearn import model_selection
from matplotlib import pyplot as plt

# generate a synthetic regression dataset (10 000 samples, 10 features)
X, y = datasets.make_regression(10000, 10, random_state=5)

# 5-fold cross-validation, the default score for regression is R^2
rf = ensemble.RandomForestRegressor(max_features='log2')  #!
scores = model_selection.cross_val_score(rf, X, y, cv=5)  #!

print(scores)  #!
print("Mean score: " + str(np.mean(scores)))  #!

# score of each fold and the mean score as a horizontal line
plt.bar(range(1, 6), scores)
plt.axhline(np.mean(scores), color='red')
plt.show()

# bonus: compare with linear regression
lin = linear_model.LinearRegression()  #!
lin_scores = model_selection.cross_val_score(lin, X, y, cv=5)  #!
print("Linear regression: " + str(np.mean(lin_scores)))
plt.boxplot([scores, lin_scores])
plt.xticks([1, 2], ["random forest", "linear regression"])
plt.show()
