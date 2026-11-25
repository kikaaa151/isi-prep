import numpy as np
from itertools import product
from sklearn import datasets
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

# 200 features, only 5 informative
X, y = datasets.make_classification(n_samples=750, n_features=200, n_informative=5, random_state=29)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)

# baseline: decision tree with default parameters
dt = DecisionTreeClassifier(random_state=0)  #!
dt.fit(X_train, y_train)
preds = dt.predict(X_test)
print("Prediction accuracy:", (y_test == preds).mean())  #!

# 1. different values of max_depth
for depth in range(1, 21):  #!
    dt = DecisionTreeClassifier(max_depth=depth, random_state=0)  #!
    dt.fit(X_train, y_train)
    preds = dt.predict(X_test)
    print(depth, (y_test == preds).mean())

# 2. + 3. other parameters, keep the best combination
best_acc, best_params = 0, None
for crit, depth, leaf, split in product(['gini', 'entropy'], range(1, 11), [1, 5, 10], [2, 10, 20]):  #!
    dt = DecisionTreeClassifier(criterion=crit, max_depth=depth, min_samples_leaf=leaf,  #!
                                min_samples_split=split, random_state=0)  #!
    dt.fit(X_train, y_train)
    acc = (y_test == dt.predict(X_test)).mean()
    if acc > best_acc:  #!
        best_acc, best_params = acc, (crit, depth, leaf, split)

print("Best accuracy:", best_acc, best_params)
