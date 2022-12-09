""" Models for users, posts, comments, and tags """

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def connect_db(app):
    app.app_context().push()
    db.app = app
    db.init_app(app)

# models vvv

class User(db.Model):
    """ Model for users table """

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    username = db.Column(
        db.String(50),
        nullable=False,
        unique=True
    )


class Post(db.Model):
    """ Model for posts table """

    __tablename__ = "posts"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    author = db.Column(
        db.String(50),
        db.ForeignKey("users.id")
    )

    title = db.Column(
        db.Text,
        nullable=False
    )

    # neither content nor url are required - post could have one or the other
    # or both; need to handle validation (that at least one is provided) on 
    # front-end
    content = db.Column(
        db.Text
    )

    url = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        nullable=false,
        default=db.func.now()
    )

    likes = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )


class Comment(db.Model):
    """ Model for comments table """

    __tablename__ = "comments"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    content = db.Column(
        db.Text,
        nullable=False
    )
    
    likes = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        nullable=false,
        default=db.func.now()
    )

    # not setting up as FK since this could be a parent comment, in which case
    # this would be "None"
    parent_comment_id = db.Integer(
        db.Integer
    )

    author = db.Column(
        db.String(50),
        db.ForeignKey("users.id")
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id")
    )


class Tag(db.Model):
    """ Model for tags table """

    __tablename__ = "tags"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    tag = db.Column(
        db.String(30),
        nullable=False,
        unique=True
    )

    description = db.Column(
        db.Text
    )


class PostTag(db.Model):
    """ Model for join table between posts and tags """

    __tablename__ = "posts_tags"

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id")
    )

    tag_id = db.Column(
        db.Integer,
        db.ForeignKey("tags.id")
    )
    
