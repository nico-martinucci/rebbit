""" Models for users, posts, comments, and tags """

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

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

    password = db.Column(
        db.Text,
        nullable=False
    )

    email = db.Column(
        db.Text,
        nullable=False
    )

    posts = db.relationship(
        "Post",
        backref="user"
    )

    comments = db.relationship(
        "Comment",
        backref="user"
    )

    @classmethod
    def signup(cls, username, email, password):
        """ Hashes provided password and returns a new User instance. """
        
        hashed = bcrypt.generate_password_hash(password).decode("utf8")
        user = cls(
            username=username, 
            email=email, 
            password=hashed
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """ Authenticates the provided username/password combo. """

        user = cls.query.filter_by(username=username).one_or_none()

        if user and bcrypt.check_password_hash(user.password, password):
            return user
        else:
            return False


class Post(db.Model):
    """ Model for posts table """

    __tablename__ = "posts"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
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
        nullable=False,
        default=db.func.now()
    )

    likes = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    tags = db.relationship(
        "Tag",
        secondary="posts_tags",
        backref="posts"
    )

    comments = db.relationship(
        "Comment",
        backref="post"
    )

    @property
    def tag_list(self):
        """ Builds comma separated list of tags for the post, capped at 5. """

        tag_list = []

        for tag in self.tags:
            tag_list.append(tag.tag)
        
        return tag_list


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
        nullable=False,
        default=db.func.now()
    )

    # not setting up as FK since this could be a parent comment, in which case
    # this would be "None"
    parent_comment_id = db.Column(
        db.Integer
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id")
    )

    def serializeHtml(self, html):
        """ Generates an html snippet for the comment. """

        return {
            "parent_comment_id": self.parent_comment_id, # using this
            "html": html # using this
        }


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
        db.Text,
        nullable=False
    )


class PostTag(db.Model):
    """ Model for join table between posts and tags """

    __tablename__ = "posts_tags"

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id"),
        primary_key=True
    )

    tag_id = db.Column(
        db.Integer,
        db.ForeignKey("tags.id"),
        primary_key=True
    )
    
