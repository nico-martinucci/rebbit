# rebbit
A light-weight reddit clone built with Flask and Boostrap

## Features
- User registration and authentication
- Multi-media posts with auto-suggestions for title and image
- Algorithmic post and comment sorting
- Real-time post and comment up/down-voting
- Infinitely cascading comment threads
- Custom post tagging and filtering
- Dynamic tag searching/adding/creating
- Back-end API for comment posting, URL scrubbing, and voting
- Post/comment limiting and infinite scroll
- Admin panel (accessible at /admin with credentials in .env)

## Setting it up
1. Create a virtual environment and install requirements:
```
$ python3 -m venv venv
$ source venv/bin/activate
$ pip3 install -r requirements.txt
```
2. Set up the database (PostgreSQL):
```
$ psql
=# CREATE DATABASE rebbit;
(ctrl+D)
```
3. Add a .env file with:
```
SECRET_KEY=(any secret key you want)
DATABASE_URL=postgresql:///rebbit
BASIC_AUTH_USERNAME='admin'
BASIC_AUTH_USERNAME='password'
```
4. Run the server:
```
$ flask run -p 5001
```
5. View at `localhost:5001`

## Tech
- Front-end: jQuery, Axios, Bootstrap
- Back-end: Flask, Jinja, SQLAlchemy, WTForms, BeautifulSoup, Bcrypt, BasicAuth

## // TODO
- Better URL scrubbing and title/image/content suggestions
- User profile/display customization
- Write tests
