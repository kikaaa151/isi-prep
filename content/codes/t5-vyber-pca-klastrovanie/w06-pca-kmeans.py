import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

data = pd.read_csv('market_research.csv')

# how many components are needed to keep 80 % of the variance
pca_full = PCA().fit(data)
cumulative = np.cumsum(pca_full.explained_variance_ratio_)  #!
print('Components needed for 80 %% of the variance: %d' % (np.argmax(cumulative >= 0.8) + 1))

# introduce PCA to reduce dimensionality, name the columns col1, col2 and col3
pca = PCA(n_components=3)  #!
pca.fit(data)  #!
data_reduced = pd.DataFrame(pca.transform(data), columns=["col1", "col2", "col3"])  #!

# how much of the original variance the 3 components keep
print('Explained variance ratio:', pca.explained_variance_ratio_.round(3))  #!
print('Total: %.3f' % pca.explained_variance_ratio_.sum())

# and cluster the data with reduced dim.
km = KMeans(n_clusters=3, random_state=5)  #!
y_km = km.fit_predict(data_reduced)  #!
print(np.bincount(y_km))
