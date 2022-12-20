""" nebbit application """
import os
from dotenv import load_dotenv
from flask import (Flask, request, redirect, render_template, flash, session, g, 
    jsonify)
from flask_wtf.csrf import CSRFProtect
from sqlalchemy.exc import IntegrityError
# from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User, Post, Comment, Tag
from forms import (AddPostForm, AddTagsForm, AddCommentForm, LoginForm, 
    SignupForm, CSRFProtectForm)

app = Flask(__name__)
csrf = CSRFProtect(app)
csrf.init_app(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///nebbit'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'tacosandburritos'

# debug = DebugToolbarExtension(app)

CURR_USER_KEY = "curr_user"
PLACEHOLDER_IMAGE_URL = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="

connect_db(app)
# db.drop_all()
db.create_all()

@app.before_request
def add_user_to_g():
    """If we're logged in, add curr user to Flask global."""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])

    else:
        g.user = None


@app.before_request
def create_csrf_only_form():
    """ Adds CSFR only form for use in all routes. """
    
    g.csrf_form = CSRFProtectForm()


@app.get("/")
def show_home_page():
    """ Renders home page of posts. """

    all_posts = Post.query.order_by(Post.created_at.desc()).all()

    return render_template("index.html", posts=all_posts)


@app.route("/login", methods=["GET", "POST"])
def login_user():
    """ Handles form load and loging in for an existing user. """

    form = LoginForm()

    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        user = User.authenticate(username=username, password=password)

        if user:
            flash(f"welcome, {user.username}!", "success")
            return redirect("/")
        else:
            flash(f"user {username} not found", "danger")

    return render_template("login.html", form=form)


@app.route("/signup", methods=["GET", "POST"])
def signup_user():
    """ Handles form load and registering for a new user. """

    form = SignupForm()

    if form.validate_on_submit():
        email = form.email.data
        username = form.username.data
        password = form.password.data
        password_2 = form.password_2.data

        # add in check to make sure passwords match

        new_user = User.signup(
            username=username,
            email=email,
            password=password
        )
        db.session.commit()

        session[CURR_USER_KEY] = new_user.id

        flash(f"welcome, {new_user.username}!", "success")
        return redirect("/")
    
    return render_template("signup.html", form=form)


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

        flash("tag added!", "success")
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
    form.tag_ids.choices = [
        (tag.id, tag.tag)
        for tag in current_tags
    ]

    if form.validate_on_submit():
        title = form.title.data
        url = form.url.data or PLACEHOLDER_IMAGE_URL
        content = form.content.data
        tag_ids = form.tag_ids.data

        # need to get the current user ID in order to build a post...
        new_post = Post(
            user_id=g.user.id, 
            title=title, 
            content=content, 
            url=url, 
            likes=1
        )

        db.session.add(new_post)
        db.session.commit()

        for tag in tag_ids:
            tag = Tag.query.get(tag)
            new_post.tags.append(tag)
        
        db.session.commit()

        flash("post added!", "success")
        # later, should redirect to post detail page
        return redirect("/")
        
    else:
        return render_template("add_post.html", form=form)


@app.route("/posts/<int:post_id>", methods=["GET", "POST"])
def view_post(post_id):
    """ View detail and comments for one individual post. """

    form = AddCommentForm()

    post = Post.query.get_or_404(post_id)
    parent_comments = [
        comment 
        for comment in post.comments 
        if comment.parent_comment_id == -1
    ]

    return render_template(
        "post.html", 
        form=form,
        post=post, 
        parent_comments=parent_comments
    )


###############################################################################
# API ROUTE

@app.post("/api/posts/<int:post_id>/comment")
def add_comment(post_id):
    """ 
    POSTs a new comment to the current post; 
    returns an injectable HTML snippet of the comment. 
    """

    form = AddCommentForm(obj=request.json)

    if form.validate_on_submit():
        new_comment = Comment(
            content=form.content.data,
            likes=1,
            parent_comment_id=form.parent_comment_id.data,
            user_id=g.user.id,
            post_id=post_id
        )

        db.session.add(new_comment)
        db.session.commit()

        response = {
            "html": render_template(
                "comment.html", 
                comment=new_comment, 
                form=AddCommentForm()
            )
        }

        return (jsonify(response))


@app.get("/api/comments/<int:comment_id>/children")
def get_children_comments(comment_id):
    """ 
    Get all children (not grand- or below) comments 
    for provided comment id. 
    """

    children_comments = Comment.query.filter(Comment.parent_comment_id == comment_id)

    comments = [
        {
            "html": render_template(
                "comment.html", 
                comment=comment, 
                form=AddCommentForm()
            )
        }
        for comment in children_comments
    ]

    return (jsonify(comments))