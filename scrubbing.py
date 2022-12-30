def clean_img_url(img_url):
    """ 
    Cleans up provided img url; removes query string and adds protocol 
    (if missing). 
    """

    img_url = img_url.rsplit("?", 1)[0]

    if img_url[:2] == "//":
        img_url = "https:" + img_url

    return img_url


def scrub_title(soup):
    return soup.h1.text
