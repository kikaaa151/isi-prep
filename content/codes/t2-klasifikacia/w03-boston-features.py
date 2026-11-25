from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# load the dataset (load_boston was removed from scikit-learn, the data is on OpenML)
boston = fetch_openml(name="boston", version=1, as_frame=True)  #!
# CHAS and RAD are categorical, so cast everything to float
X = boston.data.astype(float).to_numpy()  #!
y = boston.target.to_numpy(dtype=float)  #!
print(X.shape)
print(boston.feature_names)

# what one data sample looks like
print(X[0])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=33)  #!

# first five features against the target
fig, axes = plt.subplots(1, 5, figsize=(16, 4), sharey=True)  #!

for i in range(5):  #!
    axes[i].scatter(X_train[:, i], y_train)  #!
    axes[i].set_title('Feature ' + str(i))
    axes[i].set_xlabel(boston.feature_names[i])

axes[0].set_ylabel('Median house value')
plt.tight_layout()
plt.show()
