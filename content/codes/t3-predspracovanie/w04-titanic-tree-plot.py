import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn import tree
from matplotlib import pyplot as plt

titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)
titanic_reduced = titanic_data.drop(columns=[
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])
ages = np.array(titanic_reduced.iloc[:, 1])
ages[np.isnan(ages)] = np.mean(ages[~np.isnan(ages)])
titanic_reduced["age"] = ages
enc = LabelEncoder()
titanic_reduced["sex"] = enc.fit(titanic_reduced["sex"]).transform(titanic_reduced["sex"])
titanic_reduced["pclass"] = enc.fit(titanic_reduced["pclass"]).transform(titanic_reduced["pclass"])
pclass_reshaped = np.array(titanic_reduced["pclass"]).reshape(-1, 1)
ohe_coded = OneHotEncoder().fit(pclass_reshaped).transform(pclass_reshaped).toarray()
titanic_reduced = titanic_reduced.drop(columns=["pclass"])
titanic_reduced["class 1"] = ohe_coded[:, 0]
titanic_reduced["class 2"] = ohe_coded[:, 1]
titanic_reduced["class 3"] = ohe_coded[:, 2]

X_train, X_test, y_train, y_test = train_test_split(titanic_reduced, titanic_y, test_size=0.25, random_state=33)
clf = tree.DecisionTreeClassifier(criterion='entropy', max_depth=5, min_samples_leaf=5)
clf = clf.fit(X_train, y_train)
y_pred_test = clf.predict(X_test)
print(metrics.accuracy_score(y_test, y_pred_test))
print(metrics.confusion_matrix(y_test, y_pred_test))  #!
print(clf.feature_importances_)  #!

fig = plt.figure(figsize=(25, 18))  #!
_ = tree.plot_tree(  #!
    clf, filled=True,  #!
    feature_names=['age', 'sex', '1st_class', '2nd_class', '3rd_class'],  #!
    class_names=["not survived", "survived"])  #!
plt.show()  #!
