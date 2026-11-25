import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV, cross_val_score

X, y = load_breast_cancer(return_X_y=True)

pipe_svc = Pipeline([('scl', StandardScaler()),
                     ('clf', SVC(random_state=1))])

param_range = [0.0001, 0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]
param_grid = [{'clf__C': param_range, 'clf__kernel': ['linear']},  #!
              {'clf__C': param_range, 'clf__gamma': param_range, 'clf__kernel': ['rbf']}]  #!

# inner loop: grid search tunes C (and gamma) with 2-fold CV
gs = GridSearchCV(estimator=pipe_svc, param_grid=param_grid, scoring='accuracy', cv=2)  #!

# outer loop: 5-fold CV estimates the performance of the whole tuning procedure (5 x 2 nested CV)
scores = cross_val_score(gs, X, y, scoring='accuracy', cv=5)  #!
print('CV accuracy: %.3f +/- %.3f' % (np.mean(scores), np.std(scores)))  #!
