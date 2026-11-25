import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

# load the data (4 classes: 0, 2, 3, 4 - class 0 has only 30 samples)
X = np.load('./ex_02_data/X_data.npy', allow_pickle=True)
y = np.load('./ex_02_data/y_data.npy', allow_pickle=True)

# pipeline with a scaler and an SVC classifier
pipe_svc = Pipeline([('scl', StandardScaler()), ('clf', SVC(kernel='rbf', gamma=1, C=5))])  #!

# hold-out: a single train/test split (20 % test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=4)
pipe_svc.fit(X_train, y_train)
print('Hold-Out Accuracy:', pipe_svc.score(X_test, y_test))

# stratified 5-fold cross-validation by hand
skf = StratifiedKFold(n_splits=5)  #!
scores = []
holdout_scores = []
for train, test in skf.split(X_train, y_train):  #!
    # fit on the training folds, evaluate on the validation fold
    pipe_svc.fit(X_train[train], y_train[train])  #!
    score = pipe_svc.score(X_train[test], y_train[test])  #!
    scores.append(score)
    # evaluate the same model on the hold-out set for comparison
    ho_score = pipe_svc.score(X_test, y_test)  #!
    holdout_scores.append(ho_score)
    print('Train class samples: %s, Acc: %.3f, hold-out acc: %.3f' % (
        np.bincount(y_train[train]), score, ho_score))

print('fold score results: %s' % scores)
print('Accuracy mean: %.3f +/- %.3f' % (np.mean(scores), np.std(scores)))  #!
