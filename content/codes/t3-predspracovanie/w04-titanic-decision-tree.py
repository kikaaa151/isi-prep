import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn import tree

titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)
titanic_reduced = titanic_data.drop(columns=[
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])

ages = titanic_reduced.iloc[:, 1]
ages = np.array(ages)
mean_age = np.mean(ages[~np.isnan(ages)])
ages[np.isnan(ages)] = mean_age
titanic_reduced["age"] = ages

enc = LabelEncoder()
enc.fit(titanic_reduced["sex"])
titanic_reduced["sex"] = enc.transform(titanic_reduced["sex"])
label_encoder = enc.fit(titanic_reduced["pclass"])
titanic_reduced["pclass"] = label_encoder.transform(titanic_reduced["pclass"])

ohe = OneHotEncoder()
pclass_reshaped = np.array(titanic_reduced["pclass"]).reshape(-1, 1)
one_hot_encoder = ohe.fit(pclass_reshaped)
ohe_coded = ohe.transform(pclass_reshaped).toarray()
titanic_reduced = titanic_reduced.drop(columns=["pclass"])
titanic_reduced["class 1"] = ohe_coded[:, 0]
titanic_reduced["class 2"] = ohe_coded[:, 1]
titanic_reduced["class 3"] = ohe_coded[:, 2]

X_train, X_test, y_train, y_test = train_test_split(  #!
    titanic_reduced, titanic_y, test_size=0.25, random_state=33)  #!
clf = tree.DecisionTreeClassifier(criterion='entropy', max_depth=5, min_samples_leaf=5)  #!
clf = clf.fit(X_train, y_train)  #!
y_pred_test = clf.predict(X_test)  #!
print(metrics.accuracy_score(y_test, y_pred_test))  #!
