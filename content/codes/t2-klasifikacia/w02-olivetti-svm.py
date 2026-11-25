from sklearn.datasets import fetch_olivetti_faces
from isi_utils import print_faces
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

import numpy as np
import matplotlib.pyplot as plt

# load the Olivetti faces dataset
faces = fetch_olivetti_faces()  #!
print(faces.keys())
print(faces.images.shape)
print(faces.data.shape)
print(faces.target.shape)

# show the first 80 faces
print_faces(faces.images, faces.target, 80)
plt.show()

# classify the images with a linear SVM
svc = SVC(kernel='linear')  #!
X_train, X_test, y_train, y_test = train_test_split(faces.data, faces.target, test_size=0.25,  #!
                                                    random_state=0, stratify=faces.target)  #!
svc.fit(X_train, y_train)  #!
y_predict = svc.predict(X_test)  #!
print("Classification accuracy:", accuracy_score(y_test, y_predict))  #!

# reshape test vectors back to 64x64 images
test_faces = [np.reshape(a, (64, 64)) for a in X_test]

# predicted vs. true labels
print_faces(test_faces, y_predict, 10)
print_faces(test_faces, y_test, 10)
plt.show()

# misclassified test images
wrong = np.where(y_test != y_predict)[0]  #!
print("Misclassified:", len(wrong), "of", len(y_test))
