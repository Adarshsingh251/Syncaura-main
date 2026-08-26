import pandas as pd


df = pd.read_csv("new_dataset2.csv")

print("Shape:", df.shape)
print(df.head())


print(df['label'].value_counts())


df = df.drop_duplicates()
print("Shape after dropping duplicates:", df.shape)


label_map = {'important': 1, 'not_important': 0}
df['label_num'] = df['label'].map(label_map)

print(df[['sentence', 'label', 'label_num']].head())


df.to_csv("new_dataset2_clean.csv", index=False)
print("Saved as new_dataset2_clean.csv")




