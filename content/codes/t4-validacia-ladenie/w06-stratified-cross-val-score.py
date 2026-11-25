import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X = np.load('./ex_02_data/X_data.npy', allow_pickle=True)
y = np.load('./ex_02_data/y_data.npy', allow_pickle=True)
pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC(kernel='rbf', gamma=1, C=5))])
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=4)

# the whole cross-validation loop in a single call
scores = cross_val_score(pipe_svc, X_train, y_train, cv=5)  #!
print('cross_val_score results: %s' % scores)
print('Accuracy mean: %.3f +/- %.3f' % (np.mean(scores), np.std(scores)))  #!

# hold-out scores of the 5 fold models
skf = StratifiedKFold(n_splits=5)
holdout_scores = []
for train, test in skf.split(X_train, y_train):  #!
    pipe_svc.fit(X_train[train], y_train[train])
    holdout_scores.append(pipe_svc.score(X_test, y_test))  #!
print('hold-out results: %s' % holdout_scores)
print('Accuracy mean for hold-out: %.3f +/- %.3f' % (np.mean(holdout_scores), np.std(holdout_scores)))

# bonus: samples of the rare class 0 in every validation fold
for cv in [KFold(n_splits=5), StratifiedKFold(n_splits=5)]:  #!
    counts = [int(np.sum(y_train[test] == 0)) for train, test in cv.split(X_train, y_train)]  #!
    print(type(cv).__name__, counts)  #!
