from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy

import settings

from pyelasticsearch import ElasticSearch


app = Flask(__name__)
app.debug = settings.DEBUG
app.secret_key = settings.SECRET_KEY

app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URI
db = SQLAlchemy(app)

es_search = ElasticSearch(settings.ES_SEARCH_URL)
es_log = ElasticSearch(settings.ES_LOG_URL)

app.config['MAIL_SERVER'] = settings.MAIL_SERVER
app.config['MAIL_PORT'] = settings.MAIL_PORT
app.config['MAIL_USE_TLS'] = settings.MAIL_USE_TLS
app.config['MAIL_USE_SSL'] = settings.MAIL_USE_SSL
app.config['MAIL_USERNAME'] = settings.MAIL_USERNAME
app.config['MAIL_PASSWORD'] = settings.MAIL_PASSWORD

import views
