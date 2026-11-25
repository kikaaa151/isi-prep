import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

# load the data (heart disease dataset: 303 patients, 13 features, target 0/1)
X = np.load('./ex_01_data/X_data.npy', allow_pickle=True)
y = np.load('./ex_01_data/y_data.npy', allow_pickle=True)

# pipeline with a scaler and a classifier without any parameters set
pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC())])  #!

# powers of 10
param_range = [0.001, 0.01, 0.1, 1, 10, 100]

# a list of grids - one dictionary per kernel, names are <step name>__<parameter>
param_grid = [  #!
    {'clf__kernel': ['linear'], 'clf__C': param_range},  #!
    {'clf__kernel': ['rbf'], 'clf__C': param_range, 'clf__gamma': param_range},  #!
    {'clf__kernel': ['poly'], 'clf__C': param_range, 'clf__gamma': param_range, 'clf__degree': [1, 2, 3]}]  #!

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=1)

gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=5, n_jobs=-1)  #!
gs = gs.fit(X_train, y_train)  #!

print('All scores: ', gs.cv_results_['mean_test_score'])
print('Best score: ', gs.best_score_)
print('Best parameters: ', gs.best_params_)
print('Test accuracy: ', gs.score(X_test, y_test))
