from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy

import settings

from pyelasticsearch import ElasticSearch
#from elasticsearch import Elasticsearch


app = Flask(__name__)
app.debug = settings.DEBUG
app.secret_key = settings.SECRET_KEY

app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URI
db = SQLAlchemy(app)

es_search = ElasticSearch(settings.ES_SEARCH_URL)
es_log = ElasticSearch(settings.ES_LOG_URL)
#es_search = Elasticsearch([{'host': settings.ES_SEARCH_HOST, 'port': settings.ES_SEARCH_PORT, 'url_prefix': settings.ES_SEARCH_URL_PREFIX, 'use_ssl': False}])
#es_log = Elasticsearch([{'host': settings.ES_LOG_HOST, 'port': settings.ES_LOG_PORT, 'url_prefix': settings.ES_LOG_URL_PREFIX, 'use_ssl': False}])

app.config['MAIL_SERVER'] = settings.MAIL_SERVER
app.config['MAIL_PORT'] = settings.MAIL_PORT
app.config['MAIL_USE_TLS'] = settings.MAIL_USE_TLS
app.config['MAIL_USE_SSL'] = settings.MAIL_USE_SSL
app.config['MAIL_USERNAME'] = settings.MAIL_USERNAME
app.config['MAIL_PASSWORD'] = settings.MAIL_PASSWORD

import views
