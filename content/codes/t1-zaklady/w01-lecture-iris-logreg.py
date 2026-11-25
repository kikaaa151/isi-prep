from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn import metrics
import numpy as np

# load data
iris = datasets.load_iris()
X_iris, y_iris = iris.data, iris.target

# selecting only first two features
X, y = X_iris[:, :2], y_iris

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)  #!

# "regression" is only the name of the algorithm, this is classification
clf = LogisticRegression()  #!
clf.fit(X_train, y_train)  #!

# individual samples
print("predikcia [5.3,4.1]")
print(clf.predict(np.array([5.3, 4.1]).reshape(1, -1)))  #!
print("predikcia [7.3,2.1]")
print(clf.predict(np.array([7.3, 2.1]).reshape(1, -1)))

print("accuracy on train")
y_train_predicted = clf.predict(X_train)  #!
print(metrics.accuracy_score(y_train, y_train_predicted))  #!

print("accuracy on test")
y_test_predicted = clf.predict(X_test)  #!
print(metrics.accuracy_score(y_test, y_test_predicted))  #!
