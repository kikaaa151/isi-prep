import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline

X = np.load('X_data.npy')
y = np.load('y_data.npy')

# honest comparison - selection is a part of the pipeline, so it is repeated in every CV fold
# (selecting on all data first and then cross-validating would leak information from the test folds)
pipe_all = RandomForestClassifier(n_estimators=200, random_state=5)
pipe_sel = Pipeline([('sel', SelectFromModel(RandomForestClassifier(n_estimators=200, random_state=5),  #!
                                             threshold='mean')),  #!
                     ('clf', RandomForestClassifier(n_estimators=200, random_state=5))])  #!

for name, model in [('all features', pipe_all), ('selected features', pipe_sel)]:  #!
    scores = cross_val_score(model, X, y, cv=5, n_jobs=-1)  #!
    print('%-18s CV accuracy: %.3f +/- %.3f' % (name, scores.mean(), scores.std()))  #!
