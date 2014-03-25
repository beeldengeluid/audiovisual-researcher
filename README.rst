AVResearcher
============

AVResearcher is a prototype aimed at allowing media researchers to explore metadata associated with large numbers of audiovisual broadcasts. It allows them to compare and contrast the characteristics of search results for two topics, across time and in terms of content. Broadcasts can be searched and compared not only on the basis of traditional catalog descriptions, but also in terms of spoken content (subtitles), and social chatter (tweets associated with broadcasts). AVResearcher is a new and ongoing valorisation project at the Netherlands Institute for Sound and Vision. `more details <http://ceur-ws.org/Vol-986/paper_27.pdf>`_

AVResearcher was developed by `Dispectu <http://dispectu.com>`_ for the Netherlands Institute for Sound and Vision.

Requirements
------------

- Python > 2.6

  - pip
  - virtualenv

- Relational database (e.g. SQLite, MySQL or PostgreSQL)
- An ElasticSearch index that contains documents in the AVResearcher format
- An ElasticSearch index used for storing usage logs
- A webserver with WSGI or proxy capabilities

Installation
------------

1. Clone the repository:

.. code-block:: bash

  $ git clone https://github.com/beeldengeluid/audiovisual-researcher.git
  $ cd audiovisual-researcher

2. Download r.js from http://github.com/jrburke/r.js 

.. code-block:: bash

  $ curl https://raw.github.com/jrburke/r.js/master/dist/r.js > r.js 

3. Create a virtualenv, activate it and install the required Python packages:

.. code-block:: bash

  $ virtualenv ~/my_pyenvs/avresearcher
  $ source ~/my_pyenvs/avresearcher/bin/activate
  $ pip install -r requirements.txt

4. Create a local settings file to override the default settings specified in ``settings.py``. In the next steps we describe to miminal number of settings that should be changed to get the application up-and-running. Please have a look at the comments in ``settings.py`` to get an overview of all possible settings.

.. code-block:: bash

  $ vim local_settings.py

5. When running the appliction in a production enviroment, set ``DEBUG`` to ``False``

6. Set the ``SECRET_KEY`` for the installation (this key is used to sign cookies). A good random key can be generated as follows:

.. code-block:: pycon

  >>> import os
  >>> os.urandom(24)
  '\x86\xb8f\xcc\xbf\xd6f\x96\xf0\x08v\x90\xed\xad\x07\xfa\x01\xd0\\L#\x95\xf6\xdd'

7. Set the URLs and names of the ElasticSearch indexes:

.. code-block:: pycon


  ES_SEARCH_HOST = 'localhost'
  ES_SEARCH_PORT = 9200
  ES_SEARCH_URL_PREFIX = ''
  ES_SEARCH_INDEX = 'avresearcher'
  ES_LOG_HOST = ES_SEARCH_HOST
  ES_LOG_PORT = ES_SEARCH_PORT
  ES_LOG_URL_PREFIX = ES_SEARCH_URL_PREFIX
  ES_LOG_INDEX = 'avresearcher_logs'

8. Provide the settings of the SMTP that should be used to send notification emails during registration:

.. code-block:: pycon

  MAIL_SERVER = 'localhost'
  MAIL_PORT = 25
  MAIL_USE_TLS = False
  MAIL_USE_SSL = False
  MAIL_USERNAME = None
  MAIL_PASSWORD = None

9. Provide the URI of the database. The SQLAlchemy documentation provides inforamation on how to `structure the URI <http://docs.sqlalchemy.org/en/rel_0_8/core/engines.html#database-urls>`_ for different databases. To use an SQLite database named ``avresearcher.db`` set ``DATABASE_URI`` to ``sqlite:///avresearcher.db``.

10. Load the schema in the database configured in the previous step.

.. code-block:: pycon

  >>> from app import models
  >>> models.db.create_all()

11. Use a build-in WSGI server (like uWSGI) or a standalone WSGI container (like Gunicorn) to run the Flask application. Make sure to serve static assets directly through the webserver.

.. code-block:: bash

   $ pip install gunicorn
   $ gunicorn --bind 0.0.0.0 -w 4 app:app 


License 
=======

Copyright 2013 Beeld en Geluid

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

