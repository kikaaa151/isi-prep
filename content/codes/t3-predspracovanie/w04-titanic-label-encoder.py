import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)
titanic_reduced = titanic_data.drop(columns=[
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])

# impute the missing age with the mean age
ages = titanic_reduced.iloc[:, 1]
ages = np.array(ages)
mean_age = np.mean(ages[~np.isnan(ages)])
ages[np.isnan(ages)] = mean_age
titanic_reduced["age"] = ages

print("Passenger data")
print(titanic_reduced.loc[12])

# encode sex: female/male -> 0/1
enc = LabelEncoder()  #!
enc.fit(titanic_reduced["sex"])  #!
print("\nCategorical classes:", enc.classes_)  #!
titanic_reduced["sex"] = enc.transform(titanic_reduced["sex"])  #!

print("\nPassenger data")
print(titanic_reduced.loc[12])
