import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons
from sklearn.cluster import KMeans
from sklearn.cluster import DBSCAN

# data - two interleaving half circles (non-spherical clusters)
X, y = make_moons(n_samples=200, noise=0.05, random_state=0)  #!

f, (ax1, ax2) = plt.subplots(1, 2, figsize=(8, 3))

# K-means
km = KMeans(n_clusters=2, random_state=0)  #!
y_km = km.fit_predict(X)  #!
ax1.scatter(X[y_km == 0, 0], X[y_km == 0, 1], c='lightblue', marker='o', s=40)
ax1.scatter(X[y_km == 1, 0], X[y_km == 1, 1], c='red', marker='s', s=40)
ax1.set_title('K-means clustering')

# DBSCAN
db = DBSCAN(eps=0.2, min_samples=5, metric='euclidean')  #!
y_db = db.fit_predict(X)  #!
ax2.scatter(X[y_db == 0, 0], X[y_db == 0, 1], c='lightblue', marker='o', s=40)
ax2.scatter(X[y_db == 1, 0], X[y_db == 1, 1], c='red', marker='s', s=40)
ax2.set_title('DBSCAN')

plt.tight_layout()
plt.show()
print(np.unique(y_db, return_counts=True))  #!
