import numpy as np
from sklearn.impute import SimpleImputer
from sklearn import datasets
from matplotlib import pyplot as plt

# load the iris dataset
iris = datasets.load_iris()
iris_X = iris.data

# replace about 25 % of the values with nan
rng = np.random.default_rng(0)
masking_array = rng.binomial(1, .25, iris_X.shape).astype(bool)
iris_X[masking_array] = np.nan

print(iris_X[:5])  #!

# default strategy - mean of the column
impute = SimpleImputer()  #!
iris_X_prime = impute.fit_transform(iris_X)  #!
print("Imputed (mean)")
print(iris_X_prime[:5])

impute = SimpleImputer(strategy='median')  #!
iris_X_median = impute.fit_transform(iris_X)  #!
print("Imputed (median)")
print(iris_X_median[:5])

# petal length (column 2): known values vs imputed values
known, imputed = ~masking_array[:, 2], masking_array[:, 2]  #!
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
for ax, data, name in zip(axes, [iris_X_prime, iris_X_median], ["mean", "median"]):
    ax.hist([data[known, 2], data[imputed, 2]], stacked=True, label=["known", "imputed"])  #!
    ax.set_title(name)
    ax.legend()
plt.show()
