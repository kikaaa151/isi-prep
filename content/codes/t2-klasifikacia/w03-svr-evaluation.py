from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn import svm
from sklearn import metrics

# load the dataset (load_boston was removed from scikit-learn, the data is on OpenML)
boston = fetch_openml(name="boston", version=1, as_frame=True)
# CHAS and RAD are categorical, so cast everything to float
X = boston.data.astype(float).to_numpy()
y = boston.target.to_numpy(dtype=float)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)

# standardize the features (fit on the training set only)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  #!
X_test = scaler.transform(X_test)  #!

# SVR with linear kernel
clf_svr = svm.SVR(kernel='linear')  #!
clf_svr.fit(X_train, y_train)  #!
print("Score on train (linear)\t", clf_svr.score(X_train, y_train))

# evaluation on the test set
y_pred = clf_svr.predict(X_test)  #!

print("Regression report")
print("Coefficient of determination:\t{0:.3f}".format(metrics.r2_score(y_test, y_pred)))  #!
print("Mean absolute error:\t{0:.3f}".format(metrics.mean_absolute_error(y_test, y_pred)))  #!
