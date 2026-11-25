from sklearn import datasets
import matplotlib.pyplot as plt

# fetch / load data from scikit-learn library
digits = datasets.load_digits()  #!

X = digits.data  #!
y = digits.target  #!
print(X.shape, y.shape)

# display one digit
idx = 5
plt.figure(1, figsize=(3, 3))
plt.imshow(digits.images[idx], cmap=plt.cm.gray_r)  #!
plt.title(f"label = {y[idx]}")
plt.show()

# more digits at once
fig, axes = plt.subplots(2, 5, figsize=(8, 3.5))  #!
for ax, image, label in zip(axes.ravel(), digits.images, y):  #!
    ax.imshow(image, cmap=plt.cm.gray_r)
    ax.set_title(label)
    ax.axis("off")
plt.tight_layout()
plt.show()
