import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

column_values = ['number', 'squares', 'cubes']

# dataframe "A"
A_array = np.array([[1, 1, 1], [2, 4, 8], [3, 9, 27], [4, 16, 64]])
A_index_values = ['first', 'second', 'third', 'fourth']
A_df = pd.DataFrame(data=A_array, index=A_index_values, columns=column_values)  #!

# dataframe "B"
B_array = np.array([[5, 25, 125], [6, 36, 216], [7, 49, 343]])
B_index_values = ['fifth', 'sixth', 'seventh']
B_df = pd.DataFrame(data=B_array, index=B_index_values, columns=column_values)

# 1) join A and B into one dataframe
df = pd.concat([A_df, B_df])  #!
print(df)

# 2) the column "cubes"
cubes = df['cubes']  #!

# 3) split both, rows of X and y stay paired
X_train, X_test, y_train, y_test = train_test_split(df, cubes, test_size=0.25, random_state=0)  #!
print(X_train)
print(y_train)
print(X_test)
print(y_test)
