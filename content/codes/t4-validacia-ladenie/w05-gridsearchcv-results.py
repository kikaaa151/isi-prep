import pandas as pd
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, train_test_split
from matplotlib import pyplot as plt

X, y = make_classification(1000, n_features=5, random_state=5)
lr = LogisticRegression(class_weight='balanced', solver='liblinear')
param_grid = {'l1_ratio': [0, 1], 'C': [0.001, 0.01, 0.1, 1, 10, 100]}

# bonus: split first, run the grid search on the training set only
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=5)  #!
gs = GridSearchCV(lr, param_grid, cv=5)
gs.fit(X_train, y_train)  #!
print(gs.best_params_, gs.best_score_)
print("Test accuracy:", gs.score(X_test, y_test))  #!

# mean CV score against C, L2 and L1 separately, std as error bars
results = pd.DataFrame(gs.cv_results_)  #!
for l1_ratio, name in [(0, 'L2'), (1, 'L1')]:
    part = results[results['param_l1_ratio'] == l1_ratio]  #!
    plt.errorbar(part['param_C'], part['mean_test_score'], yerr=part['std_test_score'], label=name)  #!
plt.xscale('log')  #!
plt.xlabel('C')
plt.ylabel('mean CV accuracy')
plt.legend()
plt.show()
