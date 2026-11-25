from sklearn import preprocessing
from sklearn import datasets
from matplotlib import pyplot as plt

# load the wine dataset
wine = datasets.load_wine()
X, y = wine.data, wine.target

# mean and standard deviation of the first three features
print(X[:, :3].mean(axis=0))
print(X[:, :3].std(axis=0))

# scale the first three features: fit learns mean and std, transform applies them
my_scaler = preprocessing.StandardScaler()  #!
my_scaler.fit(X[:, :3])  #!
X2 = my_scaler.transform(X[:, :3])  #!

print("Scaled")
print(X2.mean(axis=0))  #!
print(X2.std(axis=0))  #!

# boxplots of the three features before and after scaling
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].boxplot(X[:, :3])  #!
axes[0].set_title("before scaling")
axes[1].boxplot(X2)  #!
axes[1].set_title("after scaling")
plt.show()
