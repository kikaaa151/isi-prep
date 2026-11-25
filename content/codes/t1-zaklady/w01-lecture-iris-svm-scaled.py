from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn import datasets
from sklearn.model_selection import train_test_split
import numpy as np
from isi_utils import plot_decision_regions
import matplotlib.pyplot as plt

iris = datasets.load_iris()
X = iris.data[:, [2, 3]]  #!
y = iris.target
print('Class labels:', np.unique(y))

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)

# fit the scaler on the training set only, transform both sets
sc = StandardScaler()  #!
sc.fit(X_train)  #!
X_train_std = sc.transform(X_train)  #!
X_test_std = sc.transform(X_test)  #!

X_combined_std = np.vstack((X_train_std, X_test_std))
y_combined = np.hstack((y_train, y_test))

# linear SVC
svm = SVC(kernel='linear', C=1, random_state=0)  #!
svm.fit(X_train_std, y_train)  #!
plot_decision_regions(X_combined_std, y_combined, classifier=svm)
plt.show()

# rbf SVC, increase gamma to 200 to see overfitting
svm = SVC(kernel='rbf', random_state=0, gamma=2, C=10)  #!
svm.fit(X_train_std, y_train)
plot_decision_regions(X_combined_std, y_combined, classifier=svm)
plt.show()
