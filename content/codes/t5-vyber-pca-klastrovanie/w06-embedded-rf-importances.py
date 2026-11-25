import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel

# load data (heart disease dataset - the same data as in the wrapper method)
X = np.load('X_data.npy')
y = np.load('y_data.npy')
feature_names = np.array(['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
                          'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'])
print(X.shape)

# embedded method - the importance of the features is a by-product of training the model
rf = RandomForestClassifier(n_estimators=200, random_state=5)  #!
rf.fit(X, y)  #!

order = np.argsort(rf.feature_importances_)[::-1]  #!
for i in order:
    print('%-10s %.3f' % (feature_names[i], rf.feature_importances_[i]))

# keep the features whose importance is above the mean importance
selector = SelectFromModel(rf, threshold='mean', prefit=True)  #!
X_selected = selector.transform(X)  #!

print(X_selected.shape)
print('Selected features:', feature_names[selector.get_support()].tolist())  #!
