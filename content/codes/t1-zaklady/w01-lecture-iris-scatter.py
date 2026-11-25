from sklearn import datasets
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# load data
iris = datasets.load_iris()
X_iris, y_iris = iris.data, iris.target

# selecting only first two features
X, y = X_iris[:, :2], y_iris

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)
print(X_train.shape, y_train.shape)

# one colour per class, boolean mask picks the samples of class i
colors = ['red', 'greenyellow', 'blue']
for i in range(len(colors)):  #!
    xs = X_train[:, 0][y_train == i]  #!
    ys = X_train[:, 1][y_train == i]  #!
    plt.scatter(xs, ys, c=colors[i])  #!
plt.legend(iris.target_names)  #!
plt.xlabel('Sepal length')
plt.ylabel('Sepal width')
plt.show()
