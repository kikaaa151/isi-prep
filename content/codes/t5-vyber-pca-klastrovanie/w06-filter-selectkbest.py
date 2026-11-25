import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif

# heart disease dataset (the same data as in the wrapper method)
X = np.load('X_data.npy')
y = np.load('y_data.npy')
feature_names = np.array(['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
                          'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'])

# univariate filter - every feature alone is scored against the target (ANOVA F-test)
kbest = SelectKBest(f_classif, k=5).fit(X, y)  #!
order = np.argsort(kbest.scores_)[::-1]  #!
for i in order:
    print('%-10s %.1f' % (feature_names[i], kbest.scores_[i]))  #!

X_selected = kbest.transform(X)  #!
print(X_selected.shape)
print('Selected features:', feature_names[kbest.get_support()].tolist())  #!
