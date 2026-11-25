import numpy as np
import itertools as it
from sklearn import datasets
from sklearn.tree import DecisionTreeClassifier
from matplotlib import pyplot as plt

# generate a synthetic classification dataset
X, y = datasets.make_classification(n_samples=2000, n_features=10, random_state=5)

# parameter grid - every combination of the values is tried
criteria = ['gini', 'entropy']  #!
max_features = ['sqrt', 5, None]  #!
parameter_space = it.product(criteria, max_features)  #!

# random train/test split (about 50 % / 50 %)
rng = np.random.default_rng(5)
train_set = rng.choice([True, False], size=len(y))  #!

accuracies = {}
for criterion, max_feature in parameter_space:  #!
    dt = DecisionTreeClassifier(criterion=criterion, max_features=max_feature, random_state=5)  #!
    dt.fit(X[train_set], y[train_set])  #!
    accuracies[(criterion, max_feature)] = float((dt.predict(X[~train_set]) == y[~train_set]).mean())  #!

print(accuracies)

# heatmap of the accuracies: rows = max_features, columns = criterion
plot_array = [[accuracies[(criterion, max_feature)] for criterion in criteria] for max_feature in max_features]
f, ax = plt.subplots(figsize=(7, 4))
colors = ax.matshow(plot_array, cmap='RdBu_r')
ax.set_xticks(range(len(criteria)), criteria)
ax.set_yticks(range(len(max_features)), [str(m) for m in max_features])
f.colorbar(colors)
plt.show()
