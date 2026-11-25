# get familiar with the Titanic dataset
import pandas as pd
import numpy as np

# load the Titanic dataset, the target is the "survived" column
titanic_data = pd.read_csv('data/titanic.txt')  #!
titanic_y = np.array(titanic_data.survived)  #!

print("First rows")
print(titanic_data.head())  #!
print("Columns and data types")
titanic_data.info()  #!
print("Basic statistics")
print(titanic_data.describe(include="all"))
print("Missing values per column")
print(titanic_data.isna().sum())  #!
print("Class distribution (survived)")
print(titanic_data.survived.value_counts())  #!
print("Survival rate by sex")
print(titanic_data.groupby("sex")["survived"].mean())  #!
