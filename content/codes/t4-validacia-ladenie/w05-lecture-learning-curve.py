import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import learning_curve

# Wisconsin breast cancer (the lecture reads the same data from wdbc.data)
X, y = load_breast_cancer(return_X_y=True)

pipe_lr = Pipeline([('scl', StandardScaler()),
                    ('clf', LogisticRegression(solver='lbfgs', random_state=1))])  #!

# accuracy for 10 sizes of the training set, 10-fold stratified CV for each size
train_sizes, train_scores, test_scores = learning_curve(estimator=pipe_lr, X=X, y=y,  #!
                                                        train_sizes=np.linspace(0.1, 1.0, 10),  #!
                                                        cv=10, n_jobs=1)  #!
train_mean = np.mean(train_scores, axis=1)  #!
test_mean = np.mean(test_scores, axis=1)  #!
print(train_sizes)
print(np.round(train_mean, 3))
print(np.round(test_mean, 3))

plt.plot(train_sizes, train_mean, marker='o', label='training accuracy')  #!
plt.plot(train_sizes, test_mean, marker='s', linestyle='--', label='validation accuracy')  #!
plt.xlabel('Number of training samples')
plt.ylabel('Accuracy')
plt.legend(loc='lower right')
plt.show()
