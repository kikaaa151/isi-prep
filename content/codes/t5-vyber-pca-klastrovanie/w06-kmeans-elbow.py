import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

# market research data (customers of a shop, already standardized - mean 0, std 1)
data = pd.read_csv('market_research.csv')
print(data.shape)

# distortion = sum of squared distances of the samples to their nearest centroid (inertia_)
# elbow method: run K-means for 1..10 clusters and look for the elbow of the curve
distortions = []
for i in range(1, 11):  #!
    km = KMeans(n_clusters=i, random_state=5)  #!
    km.fit(data)  #!
    distortions.append(km.inertia_)  #!
plt.plot(range(1, 11), distortions, marker='o')  #!
plt.xlabel('# of clusters')
plt.ylabel('Distortion')
plt.title("Distortion to # of clusters without dim. reduction")
plt.tight_layout()
plt.show()

# cluster without dimensionality reduction, number of clusters = 3
km = KMeans(n_clusters=3, random_state=5)  #!
y_km = km.fit_predict(data)  #!
print(np.bincount(y_km))
