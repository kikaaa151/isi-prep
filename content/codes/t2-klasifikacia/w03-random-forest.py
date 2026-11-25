from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# create the dataset with 1,000 samples
X, y = datasets.make_classification(1000, random_state=500)  #!

# split the generated dataset into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=7)  #!

# train a Random Forest classifier and predict labels for the test set
rf = RandomForestClassifier()  #!
rf.fit(X_train, y_train)  #!

y_predict = rf.predict(X_test)  #!

# classification accuracy on the test set
print("Accuracy:\t", accuracy_score(y_test, y_predict))  #!
print("Total Correct:\t", (y_test == y_predict).sum())
