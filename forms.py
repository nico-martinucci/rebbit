from flask_wtf import FlaskForm
from wtforms import (StringField, SelectField, TextAreaField, 
    SelectMultipleField, PasswordField, EmailField, HiddenField)
from wtforms.validators import InputRequired, Optional, URL, length

STANDARD_FORM_INPUT_CLASSES = "form-control col-6 mb-3"
SHORT_FORM_INPUT_CLASSES = "form-control col-3 mb-3"

class AddPostForm(FlaskForm):
    """ Form for adding a new post. """

    title = StringField(
        "Title: ",
        validators=[InputRequired()],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    url = StringField(
        "Link: ",
        validators=[URL(), Optional()],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    content = TextAreaField(
        "Content: ",
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES, "rows": "3"}
    )

    tag_ids = SelectMultipleField(
        "Tags: ",
        coerce=int,
        render_kw={"class": SHORT_FORM_INPUT_CLASSES}
    )


class AddTagsForm(FlaskForm):
    """ For for adding new tags to the database. """

    tag = StringField(
        "Tag: ",
        validators=[InputRequired()],
        render_kw={"class": SHORT_FORM_INPUT_CLASSES}
    )
    
    description = TextAreaField(
        "Description: ",
        validators=[InputRequired()],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES, "rows": "3"}
    )


class AddCommentForm(FlaskForm):
    """ Form for adding a new comment to a post. """

    content = TextAreaField(
        "Add a comment: ",
        validators=[InputRequired()],
        render_kw={"class": "comment-text form-control", "rows": "3"}
    )

    parent_comment_id = HiddenField(
        "parent_comment_id",
        validators=[InputRequired()]
    )

class SignupForm(FlaskForm):
    """ Form for registering a new user. """

    email = EmailField(
        "Email: ",
        validators=[InputRequired()],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    username = StringField(
        "Username: ",
        validators=[InputRequired(), length(max=20)],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    password = PasswordField(
        "Password: ",
        validators=[InputRequired(), length(max=20)],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    password_2 = PasswordField(
        "Re-type Password: ",
        validators=[InputRequired(), length(max=20)],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

class LoginForm(FlaskForm):
    """ Form for logging in for an existing user. """

    username = StringField(
        "Username: ",
        validators=[InputRequired(), length(max=20)],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )

    password = PasswordField(
        "Password: ",
        validators=[InputRequired(), length(max=20)],
        render_kw={"class": STANDARD_FORM_INPUT_CLASSES}
    )
    
class CSRFProtectForm(FlaskForm):
    """Form just for CSRF Protection"""