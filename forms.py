from flask_wtf import FlaskForm
from wtforms import (StringField, SelectField, TextAreaField, 
    SelectMultipleField, PasswordField, EmailField)
from wtforms.validators import InputRequired, Optional, URL, length

class AddPostForm(FlaskForm):
    """ Form for adding a new post. """

    title = StringField(
        "Title: ",
        validators=[InputRequired()]
    )

    url = StringField(
        "Link: ",
        validators=[URL(), Optional()]
    )

    content = TextAreaField(
        "Content: "
    )

    tag_ids = SelectMultipleField(
        "Tags: ",
        coerce=int
    )


class AddTagsForm(FlaskForm):
    """ For for adding new tags to the database. """

    tag = StringField(
        "Tag: ",
        validators=[InputRequired()]
    )
    
    description = TextAreaField(
        "Description: ",
        validators=[InputRequired()]
    )


class RegisterForm(FlaskForm):
    """ Form for registering a new user. """

    email = EmailField(
        "Email: ",
        validators=[InputRequired()]
    )

    username = StringField(
        "Username: ",
        validators=[InputRequired(), length(max=20)]
    )

    password = PasswordField(
        "Password: ",
        validators=[InputRequired(), length(max=20)]
    )

    password_2 = PasswordField(
        "Re-type Password: ",
        validators=[InputRequired(), length(max=20)]
    )

class LoginForm(FlaskForm):
    """ Form for logging in for an existing user. """

    username = StringField(
        "Username: ",
        validators=[InputRequired(), length(max=20)]
    )

    password = PasswordField(
        "Password: ",
        validators=[InputRequired(), length(max=20)]
    )
    
class CSRFProtectForm(FlaskForm):
    """Form just for CSRF Protection"""