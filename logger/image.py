from PIL import Image
import urllib
import json

def save_image(item, tree):
    img = tree.xpath(item['xpath_img'])[0]
    obj = json.loads(img)
    image_url = list(obj.keys())[0]
    urllib.request.urlretrieve(image_url, "../logs/{}.jpg".format(item['id']))

def save_thumbnail(item):
    img = Image.open("../logs/{}.jpg".format(item['id']))
    img.thumbnail((48, 48), Image.ANTIALIAS)
    img.save("../logs/{}.thumbnail".format(item['id']), 'JPEG')