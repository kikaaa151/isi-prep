from sklearn import datasets
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# generate a synthetic dataset
X, y = datasets.make_classification(n_samples=1000, n_features=3, n_redundant=0, random_state=1)  #!

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)  #!

# 1. decision tree
dtc = DecisionTreeClassifier()  #!
dtc.fit(X_train, y_train)  #!
y_predict = dtc.predict(X_test)  #!
print("Presnost klasifikacie dtc:", accuracy_score(y_test, y_predict))  #!

# 2. linear SVM on the same split
svc = SVC(kernel='linear')  #!
svc.fit(X_train, y_train)
y_predict = svc.predict(X_test)
print("Presnost klasifikacie svc:", accuracy_score(y_test, y_predict))
