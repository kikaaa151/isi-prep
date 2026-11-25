import numpy as np
from sklearn.feature_selection import RFECV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

# load data (heart disease dataset)
X = np.load('X_data.npy')
y = np.load('y_data.npy')
feature_names = np.array(['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
                          'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'])
print(X.shape)

# scale the features, otherwise the weights (coef_) are not comparable
clf = Pipeline([('scl', StandardScaler()),  #!
                ('clf', SVC(C=1, kernel='linear'))])  #!

# RFECV removes the feature with the smallest |weight| and evaluates every subset with 5-fold CV
selector = RFECV(clf, step=1, cv=5, scoring='accuracy',  #!
                 importance_getter='named_steps.clf.coef_')  #!
X_selected = selector.fit_transform(X, y)  #!

print(X_selected.shape)
print('Optimal number of features:', selector.n_features_)  #!
print('Selected features:', feature_names[selector.support_].tolist())  #!
print('Ranking (1 = selected):', dict(zip(feature_names.tolist(), selector.ranking_.tolist())))  #!
