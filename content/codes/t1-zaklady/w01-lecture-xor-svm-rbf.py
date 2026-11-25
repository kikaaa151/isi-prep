import matplotlib.pyplot as plt
import numpy as np
from sklearn.svm import SVC
from isi_utils import plot_decision_regions

# XOR data (linearly not separable) with noise
np.random.seed(0)
X_xor = np.random.randn(200, 2)  #!
y_xor = np.logical_xor(X_xor[:, 0] > 0, X_xor[:, 1] > 0)  #!
y_xor = np.where(y_xor, 1, -1)  #!

plt.scatter(X_xor[y_xor == 1, 0], X_xor[y_xor == 1, 1], c='b', marker='x', label='1')
plt.scatter(X_xor[y_xor == -1, 0], X_xor[y_xor == -1, 1], c='r', marker='s', label='-1')
plt.xlim([-3, 3])
plt.ylim([-3, 3])
plt.legend(loc='best')
plt.tight_layout()
plt.show()

# SVM with radial basis function kernel
svm = SVC(kernel='rbf', random_state=0, gamma=2, C=0.10)  #!
svm.fit(X_xor, y_xor)  #!
plot_decision_regions(X_xor, y_xor, classifier=svm)  #!

plt.legend(loc='upper left')
plt.tight_layout()
plt.show()
