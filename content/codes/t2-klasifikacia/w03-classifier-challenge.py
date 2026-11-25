import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

# binary classification, 3750 training / 1250 test samples, 30 features
X_train = np.load('../data/X_train.npy')
X_test = np.load('../data/X_test.npy')
y_train = np.load('../data/y_train.npy')
y_test = np.load('../data/y_test.npy')

# classifiers of our choice
classifiers = {
    'Decision tree': DecisionTreeClassifier(random_state=0),  #!
    'Random forest': RandomForestClassifier(random_state=0),  #!
    'KNN': KNeighborsClassifier(n_neighbors=15),  #!
    'SVM rbf': SVC(kernel='rbf'),  #!
}

# the same fit / predict / accuracy for every classifier
for name, clf in classifiers.items():  #!
    clf.fit(X_train, y_train)  #!
    y_predict = clf.predict(X_test)
    print(name, accuracy_score(y_test, y_predict))  #!
