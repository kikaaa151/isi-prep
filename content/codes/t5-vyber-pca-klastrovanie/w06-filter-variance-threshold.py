import numpy as np
import pandas as pd
from sklearn.feature_selection import VarianceThreshold

# load the data - ID is only an identifier, not a feature
data = pd.read_csv('employees_research.csv').drop(columns=['ID'])  #!

# create dummy low variance data (values around 1, variance ~0.003)
rng = np.random.default_rng(5)
data["spam"] = rng.uniform(low=0.9, high=1.1, size=len(data))  #!
print(data.shape)
print(data.var())

# filter method - no model and no target, only the statistics of the feature
selector = VarianceThreshold(threshold=0.05)  #!
new_selection = selector.fit_transform(data)  #!

print(new_selection.shape)
print('Kept features:   ', list(selector.get_feature_names_out()))  #!
print('Removed features:', list(data.columns[~selector.get_support()]))  #!
