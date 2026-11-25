from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV

# generate a synthetic classification dataset
X, y = make_classification(1000, n_features=5, random_state=5)

# solver='liblinear' supports both L1 and L2 regularization
lr = LogisticRegression(class_weight='balanced', solver='liblinear')

# 0 -> L2 regularization, 1 -> L1; C = inverse of the regularization strength
param_grid = {'l1_ratio': [0, 1], 'C': [0.001, 0.01, 0.1, 1, 10, 100]}  #!

# every combination is evaluated with 5-fold cross-validation
gs = GridSearchCV(lr, param_grid, cv=5)  #!
gs.fit(X, y)  #!

print(gs.best_params_)  #!
print(gs.best_score_)  #!

# mean test score of every combination
for params, score in zip(gs.cv_results_['params'], gs.cv_results_['mean_test_score']):  #!
    print(params, score)
