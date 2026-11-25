from sklearn import datasets
from sklearn.model_selection import train_test_split

# load data
iris = datasets.load_iris()  #!
X_iris, y_iris = iris.data, iris.target  #!
print(X_iris.shape, y_iris.shape)

# selecting only first two features
X, y = X_iris[:, :2], y_iris  #!

# 25% to be used as test data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)  #!

print("Rozmer X a y")
print(X_train.shape, y_train.shape)  #!
print(X_test.shape, y_test.shape)
