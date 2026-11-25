from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn import svm

# load the dataset (load_boston was removed from scikit-learn, the data is on OpenML)
boston = fetch_openml(name="boston", version=1, as_frame=True)
# CHAS and RAD are categorical, so cast everything to float
X = boston.data.astype(float).to_numpy()
y = boston.target.to_numpy(dtype=float)
print(X.shape)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)

# features have very different ranges, so standardize them (fit on the training set only)
scaler = StandardScaler()  #!
X_train = scaler.fit_transform(X_train)  #!
X_test = scaler.transform(X_test)  #!

# SVR with three different kernels
clf_svr = svm.SVR(kernel='linear')  #!
clf_svr.fit(X_train, y_train)  #!
print("Score on train (linear)\t", clf_svr.score(X_train, y_train))  #!

clf_svr_poly = svm.SVR(kernel='poly')  #!
clf_svr_poly.fit(X_train, y_train)
print("Score on train (poly)\t", clf_svr_poly.score(X_train, y_train))

clf_svr_rbf = svm.SVR(kernel='rbf')  #!
clf_svr_rbf.fit(X_train, y_train)
print("Score on train (rbf)\t", clf_svr_rbf.score(X_train, y_train))
