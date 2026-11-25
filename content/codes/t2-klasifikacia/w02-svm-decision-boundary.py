import numpy as np
import matplotlib.pyplot as plt
from sklearn import datasets
from sklearn.svm import SVC

from itertools import product
from collections import namedtuple

# two 2D blobs, linear SVM
X, y = datasets.make_blobs(n_features=2, centers=2, random_state=1)  #!
svm = SVC(kernel='linear')  #!
svm.fit(X, y)  #!

# predict the class for each point of a 20x20 grid
Point = namedtuple('Point', ['x', 'y', 'outcome'])

decision_boundery = []

xmin, xmax = np.percentile(X[:, 0], [0, 100])
ymin, ymax = np.percentile(X[:, 1], [0, 100])

for xpt, ypt in product(np.linspace(xmin - 2.5, xmax + 2.5, 20), np.linspace(ymin - 2.5, ymax + 2.5, 20)):  #!
    p = Point(xpt, ypt, svm.predict(np.array([xpt, ypt]).reshape(1, -1)))  #!
    decision_boundery.append(p)

# plot grid (decision regions) and data points
f, ax = plt.subplots(figsize=(7, 5))
colors = np.array(['r', 'b'])

for xpt, ypt, pt in decision_boundery:
    ax.scatter(xpt, ypt, color=colors[pt[0]], alpha=.15)  #!

ax.scatter(X[:, 0], X[:, 1], color=colors[y], s=30)  #!

ax.set_ylim(ymin, ymax)
ax.set_xlim(xmin, xmax)
plt.show()
