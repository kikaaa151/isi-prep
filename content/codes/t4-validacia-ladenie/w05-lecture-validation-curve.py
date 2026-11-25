import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import validation_curve

X, y = load_breast_cancer(return_X_y=True)

pipe_lr = Pipeline([('scl', StandardScaler()),
                    ('clf', LogisticRegression(solver='lbfgs', random_state=1))])

# accuracy as a function of the hyper-parameter C of the 'clf' step
param_range = [0.0001, 0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]  #!
train_scores, test_scores = validation_curve(estimator=pipe_lr, X=X, y=y,  #!
                                             param_name='clf__C',  #!
                                             param_range=param_range, cv=10)  #!
train_mean = np.mean(train_scores, axis=1)
test_mean = np.mean(test_scores, axis=1)
print(np.round(train_mean, 3))
print(np.round(test_mean, 3))

plt.plot(param_range, train_mean, marker='o', label='training accuracy')
plt.plot(param_range, test_mean, marker='s', linestyle='--', label='validation accuracy')
plt.xscale('log')  #!
plt.xlabel('Parameter C')
plt.ylabel('Accuracy')
plt.legend(loc='lower right')
plt.show()
