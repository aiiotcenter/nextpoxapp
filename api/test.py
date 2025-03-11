from PIL import Image

url = "./uploads/test.png" # Might be a problem
img = Image.open(url)

print(img)