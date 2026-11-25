import itertools as it
from sklearn import datasets
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
from matplotlib import pyplot as plt

# generate a synthetic classification dataset
X, y = datasets.make_classification(n_samples=2000, n_features=10, random_state=59)

# parameter grid
criteria = ['gini', 'entropy']
max_features = ['sqrt', 5, None]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=5)  #!

accuracies = {}
cv_scores = {}
for criterion, max_feature in it.product(criteria, max_features):  #!
    dt = DecisionTreeClassifier(criterion=criterion, max_features=max_feature, random_state=5)  #!
    dt.fit(X_train, y_train)  #!
    accuracies[(criterion, max_feature)] = accuracy_score(y_test, dt.predict(X_test))  #!
    # bonus: 5-fold cross-validation on the training set only
    cv_scores[(criterion, max_feature)] = float(cross_val_score(dt, X_train, y_train, cv=5).mean())  #!

print(accuracies)
print("Best combination (test set):", max(accuracies, key=accuracies.get))  #!
print(cv_scores)
print("Best combination (CV):", max(cv_scores, key=cv_scores.get))  #!

plt.barh([str(k) for k in accuracies], list(accuracies.values()))
plt.xlabel("test accuracy")
plt.show()
