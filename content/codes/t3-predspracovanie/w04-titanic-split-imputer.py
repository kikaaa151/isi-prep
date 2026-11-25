import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split

titanic_data = pd.read_csv('data/titanic.txt')
titanic_y = np.array(titanic_data.survived)
titanic_reduced = titanic_data.drop(columns=[
    "row.names", "survived", "name", "embarked", "home.dest", "room", "ticket", "boat"])

# split first - the imputer may learn only from the training set
X_train, X_test, y_train, y_test = train_test_split(  #!
    titanic_reduced, titanic_y, test_size=0.25, random_state=33)  #!
print("Missing ages:", X_train["age"].isna().sum(), X_test["age"].isna().sum())

# fit on the training set, transform both sets with the same mean
imp = SimpleImputer(strategy='mean')  #!
imp.fit(X_train[["age"]])  #!
X_train["age"] = imp.transform(X_train[["age"]]).ravel()  #!
X_test["age"] = imp.transform(X_test[["age"]]).ravel()  #!

print("Mean age of the training set:", imp.statistics_)  #!
print("Missing ages:", X_train["age"].isna().sum(), X_test["age"].isna().sum())
