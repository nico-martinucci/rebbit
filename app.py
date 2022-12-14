""" nebbit application """

from flask import Flask, request, redirect, render_template, flash, session
# from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User, Post, Comment, Tag
from forms import AddPostForm, AddTagsForm, LoginForm, RegisterForm

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///nebbit'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'tacosandburritos'

# debug = DebugToolbarExtension(app)

connect_db(app)
db.create_all()

@app.get("/")
def show_home_page():
    """ Renders home page of posts. """

    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login_user():
    """ Handles form load and loging in for an existing user. """

    form = LoginForm()

    if form.validate_on_submit():
        username = form.username.data
        password = form.username.password

        user = User.authenticate(username=username, password=password)

        if user:
            flash(f"welcome, {}!")
            return redirect("/")
        else:
            flash(f"user {user.username} not found")

    return render_template("login.html", form=form)


@app.route("/register", methods=["GET", "POST"])
def register_user():
    """ Handles form load and registering for a new user. """

    form = RegisterForm()

    if form.validate_on_submit():
        email = form.email.data
        username = form.username.data
        password = form.password.data
        password_2 = form.password_2.data

        # add in check to make sure passwords match

        new_user = User.register(
            username=username,
            email=email,
            password=password
        )

        #TODO: update session with current user, finish rest of route


@app.route("/add-tag", methods=["GET", "POST"])
def add_new_tag():
    """ 
    On "GET", shows form to add a new tag; 
    on "POST", adds new tag to the database. 
    """

    form = AddTagsForm()
    tags = Tag.query.all()

    if form.validate_on_submit():
        tag = form.tag.data
        description = form.description.data

        new_tag = Tag(tag=tag, description=description)

        db.session.add(new_tag)
        db.session.commit()

        flash("tag successfully added")
        return redirect("/add-tag")
    else:
        return render_template("add_tag.html", form=form, tags=tags)


@app.route("/add-post", methods=["GET", "POST"])
def add_new_post():
    """ 
    On "GET", shows form to add a new post; 
    on "POST", adds new post to the database. 
    """

    form = AddPostForm()
    current_tags = Tag.query.all()
    form.tags.choices = [
        (tag.id, tag.tag)
        for tag in current_tags
    ]

    if form.validate_on_submit():
        title = form.title.data
        url = form.url.data
        contet = form.content.data

        # need to get the current user ID in order to build a post...
        new_post = Post(author_id=1, title=title, content=content, url=url, likes=1)

        db.session.add(new_post)
        db.session.commit()

        flash("post successfully added!")
        # later, should redirect to post detail page
        return redirect("/")
        
    else:
        return render_template("add_post.html", form=form)
