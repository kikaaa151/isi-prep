import pandas as pd
import numpy as np

titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)
titanic_reduced = titanic_data.drop(columns=[
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])

print("Passenger data")
print(titanic_reduced.loc[12])

# impute the missing age with the mean of the known ages
ages = titanic_reduced.iloc[:, 1]  #!
ages = np.array(ages)  #!
mean_age = np.mean(ages[~np.isnan(ages)])  #!
ages[np.isnan(ages)] = mean_age  #!
titanic_reduced["age"] = ages  #!

print("\nPassenger data")
print(titanic_reduced.loc[12])
