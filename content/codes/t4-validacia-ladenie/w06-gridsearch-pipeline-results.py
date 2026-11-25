import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X = np.load('./ex_01_data/X_data.npy', allow_pickle=True)
y = np.load('./ex_01_data/y_data.npy', allow_pickle=True)
pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC())])
param_range = [0.001, 0.01, 0.1, 1, 10, 100]
param_grid = [
    {'clf__kernel': ['linear'], 'clf__C': param_range},
    {'clf__kernel': ['rbf'], 'clf__C': param_range, 'clf__gamma': param_range},
    {'clf__kernel': ['poly'], 'clf__C': param_range, 'clf__gamma': param_range, 'clf__degree': [1, 2, 3]}]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=1)
gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=5, n_jobs=-1)
gs = gs.fit(X_train, y_train)

# number of combinations and the best mean CV score of every kernel
results = pd.DataFrame(gs.cv_results_)  #!
print(len(results))
print(results.groupby('param_clf__kernel')['mean_test_score'].max())  #!

# heatmap of the RBF combinations: rows = gamma, columns = C
rbf = results[results['param_clf__kernel'] == 'rbf']  #!
heat = rbf.pivot_table(index='param_clf__gamma', columns='param_clf__C', values='mean_test_score')  #!
plt.matshow(heat, cmap='RdBu_r')  #!
plt.xticks(range(len(heat.columns)), heat.columns)
plt.yticks(range(len(heat.index)), heat.index)
plt.colorbar()
plt.show()

# bonus: the same (best) parameters without the scaler
params = {name.replace('clf__', ''): value for name, value in gs.best_params_.items()}  #!
scores = cross_val_score(SVC(**params), X_train, y_train, cv=5)  #!
print('Without scaling: %.3f, pipeline: %.3f' % (scores.mean(), gs.best_score_))
