import pandas as pd
import numpy as np

# load the Titanic dataset, the target is the "survived" column
titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)  #!

# drop the features that seem irrelevant - keep pclass, age and sex
titanic_reduced = titanic_data.drop(columns=[  #!
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])  #!

# passenger 12 is used to check each preprocessing step
print("Passenger data")
print(titanic_reduced.loc[12])  #!
