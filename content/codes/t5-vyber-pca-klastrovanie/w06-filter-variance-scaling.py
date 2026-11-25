import numpy as np
import pandas as pd
from sklearn.feature_selection import VarianceThreshold
from sklearn.preprocessing import MinMaxScaler

data = pd.read_csv('employees_research.csv').drop(columns=['ID'])
rng = np.random.default_rng(5)
data["spam"] = rng.uniform(low=0.9, high=1.1, size=len(data))
print(data.var().round(4))

# the variance depends on the scale -> scale every feature to [0, 1] first
scaled = pd.DataFrame(MinMaxScaler().fit_transform(data), columns=data.columns)  #!
print(scaled.var().round(4))  #!

# the same threshold now keeps different features
selector_scaled = VarianceThreshold(threshold=0.05).fit(scaled)  #!
print('Kept after scaling:', list(selector_scaled.get_feature_names_out()))  #!
