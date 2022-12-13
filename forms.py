from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import InputRequired, Optional, URL

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
        "Content: ",
    )

    tags = SelectMultipleField(
        "Tags: "
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