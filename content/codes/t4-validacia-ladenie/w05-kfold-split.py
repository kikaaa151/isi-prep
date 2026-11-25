from sklearn.datasets import make_regression
from sklearn.model_selection import KFold

N = 1000  # number of samples

# generate a synthetic regression dataset
X, y = make_regression(N, random_state=5)

# split the data into 10 folds - each fold is used once as the test set
# shuffle=True mixes the samples before splitting (important when the data are sorted)
kfold = KFold(n_splits=10, shuffle=True, random_state=5)  #!

output_string = "Fold: {}, N_train: {}, N_test: {}, first test indices: {}"
for i, (train, test) in enumerate(kfold.split(X)):  #!
    print(output_string.format(i, len(train), len(test), test[:5]))  #!
