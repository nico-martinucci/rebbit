""" rebbit application """
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from flask import (Flask, request, redirect, render_template, flash, session, g, 
    jsonify)
from flask_wtf.csrf import CSRFProtect
from sqlalchemy import desc
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
# from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User, Post, Comment, Tag, UserPostVote, UserCommentVote, PostTag
from forms import (AddPostForm, AddTagsForm, SearchTagsForm, AddCommentForm, 
    LoginForm, SignupForm, CSRFProtectForm)
from bs4 import BeautifulSoup as bs

app = Flask(__name__)
csrf = CSRFProtect(app)
csrf.init_app(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///rebbit'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'tacosandburritos'

# debug = DebugToolbarExtension(app)

CURR_USER_KEY = "curr_user"
PLACEHOLDER_IMAGE_URL = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="
MAX_AGE_CONSTANT_BOOST = 5
POST_LIMIT = 20
COMMENT_LIMIT = 3

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


@app.before_request
def get_list_of_liked_content():
    """ Gets lists of liked comments and posts for current user. """

    if g.user:
        g.liked_post_ids = [
            post.id
            for post in g.user.voted_posts
            if UserPostVote.query.filter(
                UserPostVote.post_id == post.id,
                UserPostVote.user_id == g.user.id,
                UserPostVote.score == 1
            ).one_or_none()
        ]

        g.disliked_post_ids = [
            post.id
            for post in g.user.voted_posts
            if UserPostVote.query.filter(
                UserPostVote.post_id == post.id,
                UserPostVote.user_id == g.user.id,
                UserPostVote.score == -1
            ).one_or_none()
        ]

        g.liked_comment_ids = [
            comment.id
            for comment in g.user.voted_comments
            if UserCommentVote.query.filter(
                UserCommentVote.comment_id == comment.id,
                UserCommentVote.user_id == g.user.id,
                UserCommentVote.score == 1
            ).one_or_none()
        ]

        g.disliked_comment_ids = [
            comment.id
            for comment in g.user.voted_comments
            if UserCommentVote.query.filter(
                UserCommentVote.comment_id == comment.id,
                UserCommentVote.user_id == g.user.id,
                UserCommentVote.score == -1
            ).one_or_none()
        ]



@app.get("/")
def show_home_page():
    """ Renders home page of posts. """

    all_posts = (db.session
        .query(Post)
        .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (db.extract('epoch', datetime.now() - Post.created_at))))
        .limit(POST_LIMIT)
    )

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
            session[CURR_USER_KEY] = user.id

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

        flash_messages = []

        if User.query.filter(User.email == email).one_or_none():
            flash_messages.append("this email is in use by another user.")

        if User.query.filter(User.username == username).one_or_none():
            flash_messages.append("this username has already been taken.")

        if password != password_2:
            flash_messages.append("passwords don't match.")

        if flash_messages:
            for msg in flash_messages:
                flash(msg, "danger")
            return render_template("signup.html", form=form)

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


@app.post("/logout")
def logout_user():
    """ Logs out the current user. """

    form = g.csrf_form

    if form.validate_on_submit():
        if CURR_USER_KEY in session:
            del session[CURR_USER_KEY]

        flash("You have logged out.", "success")
        return redirect("/")


@app.get("/users/<username>")
def get_user(username):
    """ Gets page for a specific user. """

    user = User.query.filter_by(username=username).one()

    user_posts = (db.session
        .query(Post)
        .filter(Post.user.has(User.username == user.username))
        .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (
            db.extract('epoch', datetime.now() - Post.created_at)
        )))
        .limit(POST_LIMIT)
    )

    return render_template("user.html", user=user, posts=user_posts)


@app.get("/tags")
def get_tags_page():
    """ Render tags page. """

    tags = (db.session
        .query(Tag.tag, func.count(PostTag.post_id).label("count"))
        .join(Tag.tagged_post_ids, isouter=True)
        .group_by(Tag.tag)
        .order_by(desc(func.count(PostTag.post_id)))
        .all()
    )
    
    return render_template(
        "tags.html", 
        search_form=SearchTagsForm(),
        add_form=AddTagsForm(), 
        tags=tags
    )


@app.get("/tags/<tag_name>")
def show_tag_detail(tag_name):
    """ Shows details (description and posts) for passed tag. """

    tag = Tag.query.filter(Tag.tag == tag_name).one()

    tagged_posts = (db.session
        .query(Post)
        .filter(Post.tags.any(Tag.tag == tag.tag))
        .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (
            db.extract('epoch', datetime.now() - Post.created_at)
        )))
        .limit(POST_LIMIT)
    )

    return render_template("tag_detail.html", tag=tag, posts=tagged_posts)


@app.route("/add-post", methods=["GET", "POST"])
def add_new_post():
    """ 
    On "GET", shows form to add a new post; 
    on "POST", adds new post to the database. 
    """

    if not g.user:
        flash("you must be signed in to post.", "warning")
        return redirect("/login")

    form = AddPostForm()
    current_tags = Tag.query.all()
    # form.tag_ids.choices = [
    #     (tag.id, tag.tag)
    #     for tag in current_tags
    # ]

    if form.validate_on_submit():
        title = form.title.data
        url = form.url.data
        img_url = form.img_url.data or PLACEHOLDER_IMAGE_URL
        content = form.content.data
        tag_ids = (form.tag_ids.data).split(",")

        new_post = Post(
            user_id=g.user.id, 
            title=title, 
            content=content, 
            url=url, 
            img_url=img_url, 
        )

        db.session.add(new_post)
        db.session.commit()

        for tag in tag_ids:
            tag = Tag.query.get(tag)
            new_post.tags.append(tag)
        
        db.session.commit()

        flash("post added!", "success")
        # later, should redirect to post detail page
        return redirect(f"/posts/{new_post.id}")
        
    else:
        return render_template("add_post.html", form=form)


@app.route("/posts/<int:post_id>", methods=["GET", "POST"])
def view_post(post_id):
    """ View detail and comments for one individual post. """

    form = AddCommentForm()

    post = Post.query.get_or_404(post_id)

    parent_comments = (db.session
        .query(Comment)
        .filter(
            Comment.post_id == post_id,
            Comment.parent_comment_id == -1)
        .order_by(desc(Comment.score + MAX_AGE_CONSTANT_BOOST / (
            db.extract('epoch', datetime.now() - Comment.created_at)
        )))
        .limit(COMMENT_LIMIT)
    )

    return render_template(
        "post_detail.html", 
        form=form,
        post=post, 
        parent_comments=parent_comments
    )


###############################################################################
# API ROUTES


@app.get("/api/posts")
def get_more_posts():
    """ Get more posts for current page. """

    offset = int(request.args["offset"])
    query_filter = request.args["filter"]
    filter_info = request.args["info"]

    new_posts = []

    # currently might repeat existing posts - need to find a way to exclude 
    # posts already on the page
    if query_filter == "none":
        new_posts = (db.session
            .query(Post)
            .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (db.extract('epoch', datetime.now() - Post.created_at))))
            .limit(POST_LIMIT)
            .offset(offset * POST_LIMIT)
        )

    elif query_filter == "user":
        new_posts = (db.session
            .query(Post)
            .filter(Post.user.has(User.username == filter_info))
            .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (
                db.extract('epoch', datetime.now() - Post.created_at)
            )))
            .limit(POST_LIMIT)
            .offset(offset * POST_LIMIT)
        )

    elif query_filter == "tag":
        new_posts = (db.session
            .query(Post)
            .filter(Post.tags.any(Tag.tag == filter_info))
            .order_by(desc(Post.score + MAX_AGE_CONSTANT_BOOST / (
                db.extract('epoch', datetime.now() - Post.created_at)
            )))
            .limit(POST_LIMIT)
            .offset(offset * POST_LIMIT)
        )

    posts = [
        {
            "html": render_template(
                "post.html", 
                post=post
            )
        }
        for post in new_posts
    ]

    return (jsonify(posts))


@app.get("/api/tags")
def get_tag_search_results():
    """ Get tag search results from from front-end input. """

    term = request.args["term"]
    loc = request.args["loc"]
    search_term = "%{}%".format(term)

    tags = (db.session
        .query(Tag.tag, Tag.id, func.count(PostTag.post_id).label("count"))
        .join(Tag.tagged_post_ids, isouter=True)
        .filter(Tag.tag.like(search_term))
        .group_by(Tag.tag, Tag.id)
        .order_by(desc(func.count(PostTag.post_id)))
        .all()
    )

    button_template = "tag_button.html"

    if loc == "post":
        button_template = "tag_button_no_link.html" 

    response = [
        {
            "html": render_template(
                button_template,
                tag=tag
            )
        }
        for tag in tags
    ]

    return jsonify(response)


@app.post("/api/tags")
def add_new_tag_api():
    """ POSTs a new tag from tag pop-up modal. """

    form = AddTagsForm(obj=request.json)

    if form.validate_on_submit():
        tag = form.tag.data
        description = form.description.data

        if Tag.query.filter(Tag.tag == tag).one_or_none():
            response = {
                "status": "duplicate",
                "flash": {
                    "message": "tag already exists!",
                    "style": "warning"
                }
            }

        else:
            new_tag = Tag(tag=tag, description=description)

            db.session.add(new_tag)
            db.session.commit()

            response = {
                "status": "success",
                "tag": new_tag.tag,
                "flash": {
                    "message": "new tag successfully added!",
                    "style": "success"
                }
            }

    else:
        response = {
            "status": "error",
            "flash": {
                    "message": "required information missing!",
                    "style": "danger"
                }
        }
            
    return jsonify(response)


@app.get("/api/posts/<int:post_id>/comments")
def get_comments(post_id):
    """ Get more comments for current post. """

    form = AddCommentForm()

    offset = int(request.args["offset"])

    comments = (db.session
        .query(Comment)
        .filter(
            Comment.post_id == post_id,
            Comment.parent_comment_id == -1
        )
        .order_by(desc(Comment.score + MAX_AGE_CONSTANT_BOOST / (
            db.extract('epoch', datetime.now() - Comment.created_at)
        )))
        .limit(COMMENT_LIMIT)
        .offset(offset * COMMENT_LIMIT)
    )

    response = [
        {
            "html": render_template(
                "comment.html", 
                comment=comment,
                form=form
            )
        }
        for comment in comments
    ]

    return jsonify(response)


@app.post("/api/posts/<int:post_id>/comments")
def add_comment(post_id):
    """ 
    POSTs a new comment to the current post; 
    returns an injectable HTML snippet of the comment. 
    """

    form = AddCommentForm(obj=request.json)

    if form.validate_on_submit():
        new_comment = Comment(
            content=form.content.data,
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
            ),
            "flash": {
                "message": "new comment successfully added!",
                "style": "success"
            }
        }

        return jsonify(response)


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


@app.get("/api/posts/get-data")
def get_url_data():
    """ Get data (h1 and image) for provided link; return them back. """

    url = request.args["url"]
    page = requests.get(url)

    soup = bs(page.text, 'html.parser')

    # soup.h1.text
    # soup.img.attrs["src"]
    # find nav; find next sibling; find first image in that sibling

    img_url = soup.img.attrs["src"]

    # if soup.nav:
    #     img_url = soup.nav.find_next_sibling().img["src"]

    response = {
        "h1": soup.h1.text,
        "img_url": img_url
    }

    return jsonify(response)


@app.post("/api/<content>/<int:content_id>/vote")
def handle_voting(content, content_id):
    """ Handles voting for both posts and comments. """

    vote_score = int(request.json["vote"]) # stores whether this is an "up" or "down" vote
    response = {}

    if content == "post":
        target_post = Post.query.get(content_id)   
        
        vote = UserPostVote.query.filter(
            UserPostVote.post_id == content_id,
            UserPostVote.user_id == g.user.id
        ).one_or_none()

        # if user has already voted at all...
        if vote:
            # remove the value of old vote from post's score
            target_post.score -= vote.score

            # if user has already submitted THIS vote...
            if vote.score == vote_score: 
                db.session.delete(vote)
            
            # if user hasn't submitted THIS vote...
            else: 
                target_post.score += vote_score
                vote.score = vote_score

        # if user hasn't submitted a vote yet at all...
        else:
            target_post.score += vote_score
            
            new_vote = UserPostVote(
                post_id = content_id,
                user_id = g.user.id,
                score = vote_score
            )
            
            db.session.add(new_vote)

        db.session.commit()
        
        response = {
            "score": target_post.score or 0
        }

    else:
        target_comment = Comment.query.get(content_id)   
        
        vote = UserCommentVote.query.filter(
            UserCommentVote.comment_id == content_id,
            UserCommentVote.user_id == g.user.id
        ).one_or_none()

        if vote:
            # remove the old vote no matter what
            target_comment.score -= vote.score

            if vote.score == vote_score:
                db.session.delete(vote)
            else:
                target_comment.score += vote_score
                vote.score = vote_score

        else:
            target_comment.score += vote_score

            new_vote = UserCommentVote(
                comment_id = content_id,
                user_id = g.user.id,
                score = vote_score
            )
            
            db.session.add(new_vote)

        db.session.commit()
        
        response = {
            "score": target_comment.score or 0
        }

    return jsonify(response)