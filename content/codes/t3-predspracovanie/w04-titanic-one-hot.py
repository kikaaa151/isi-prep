import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import OneHotEncoder

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

# step 1: convert the classes (1st/2nd/3rd) to integers 0-2
label_encoder = enc.fit(titanic_reduced["pclass"])
titanic_reduced["pclass"] = label_encoder.transform(titanic_reduced["pclass"])

# step 2: create one 0/1 column per class
ohe = OneHotEncoder()  #!
pclass_reshaped = np.array(titanic_reduced["pclass"]).reshape(-1, 1)  #!
one_hot_encoder = ohe.fit(pclass_reshaped)  #!
ohe_coded = ohe.transform(pclass_reshaped).toarray()  #!

# replace pclass with the three new columns
titanic_reduced = titanic_reduced.drop(columns=["pclass"])  #!
titanic_reduced["class 1"] = ohe_coded[:, 0]  #!
titanic_reduced["class 2"] = ohe_coded[:, 1]  #!
titanic_reduced["class 3"] = ohe_coded[:, 2]  #!

print("Passenger data")
print(titanic_reduced.loc[12])
