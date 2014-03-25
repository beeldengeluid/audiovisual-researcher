import os
_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = False

SECRET_KEY = ''

# URL of the ElasticSearch instance that contains the AVResearcher
# broadcasts index
ES_SEARCH_HOST = 'localhost'
ES_SEARCH_PORT = 9200
ES_SEARCH_URL_PREFIX = ''

ES_SEARCH_INDEX = 'avresearcher'

# URL of the ElasticSearch instance used to store usage logs (clicks,
# queries, etc.)
ES_LOG_HOST = ES_SEARCH_HOST
ES_LOG_PORT = ES_SEARCH_PORT
ES_LOG_URL_PREFIX = ES_SEARCH_URL_PREFIX
ES_LOG_INDEX = 'avresearcher_logs'

# User database URI
DATABASE_URI = 'mysql://user:pass@host/db'

# Email settings (used for account activation and user approval)
MAIL_SERVER = 'localhost'
MAIL_PORT = 25
MAIL_USE_TLS = False
MAIL_USE_SSL = False
MAIL_USERNAME = None
MAIL_PASSWORD = None

MAIL_DEFAULT_SENDER = ('AVResearcher', 'no-reply@avresearcher.org')
MAIL_REGISTRATION_SUBJECT = 'Thanks for creating an AVResearcher account'
MAIL_ACCOUNT_APPROVAL_ADDRESS = ''


# Human-readable messages send by the API
MESSAGES = {
    'missing_name': 'Please enter your name',
    'missing_email': 'Please enter an email address',
    'invalid_email': 'The email address you entered seems te be invalid',
    'missing_password': 'Please enter your password',
    'account_already_exists': 'There already exists an account with this email'
                              ' address',
    'email_verification_subject': 'Thanks for creating an AVResearcher account',
    'email_verification_body': 'Dear %s,\n\nThank you for creating an '
                               'AVResearcher account.\n\nTo verify your email '
                               'address, please click the following link:'
                               ' %s. After verification, a member of the '
                               'AVResearcher team will grant you access to the'
                               ' AVResearcher application. You will be notified'
                               ' by email as soon as your account is approved.'
                               '\n\nRegards,\nThe AVResearcher team',
    'email_approval_subject': '[AVResearcher] New user registration',
    'email_approval_body': 'The following user registered a new AVResearcher '
                           'account:\n\nName: %s\nOrganization: %s\nEmail '
                           'address: %s\n\nClick the following link to approve '
                           'this registration and grant the user access to the '
                           'application: %s',
    'email_approved_subject': 'Your AVResearcher account is approved',
    'email_approved_body': 'Dear %s,\n\nYour AVResearcher account is approved '
                           'and activated.\n\nTo start using the AVResearcher '
                           'visit: %s\n\nRegards,\nThe AVResearcher team',
    'invalid_email_or_password': 'Incorrect email or password',
    'email_not_verified': 'You did not yet verifiy your email address. Please '
                          'click the link in the email you recieved.',
    'account_not_approved': 'Your account first needs to be approved by a '
                            'member of the AVResearcher team. You will recieve'
                            ' an email as soon as permission is granted to use '
                            'the application.',
    'email_verified_title': 'Hi %s, thanks for verifying your mail address',
    'email_verified_content': 'A member of the AVResearcher team will review '
                              'your application. You will be notified by '
                              'email as soon as your account is approved.',
    'user_approved_title': '%s can now login to the application',
    'login_failed': 'Incorrect email or password',
    'login_required': 'You must be logged in to use this function'
}

HITS_PER_PAGE = 5
ALLOWED_INTERVALS = ['year', 'month', 'week', 'day']

AVAILABLE_FACETS = {
    'broadcast_start_date': {
        'name': 'Start Date',
        'description': '',
        'ui_presentation': 'range',
        'date_histogram': {
            'field': 'start',
            'interval': 'year'  # allowed values are ['year', 'month', 'week', 'day']
        },
        'nested': 'broadcastDates'
    },
    'channels': {
        'name': 'Channels',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'broadcasters',
            'size': 30
        }
    },
    'producers': {
        'name': 'Producers',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'roleValue',
            'size': 30
        },
        'facet_filter': {
            'term': {'roleKey': 'producent'}
        },
        'nested': 'roles'
    },
    'people': {
        'name': 'People',
        'description': '',
        'ui_presentation': 'checkbox',
        'nested_filter_field': 'categoryValue',
        'terms': {
            'field': 'untouched',
            'size': 30
        },
        'facet_filter': {
            'term': {'categoryKey': 'person'}
        },
        'nested': 'categories'
        # 'terms': {
        #     'field': 'roleValue',
        #     'size': 30
        # },
        # 'facet_filter' : {
        #     'or': [
        #         {'term': {'roleKey': 'maker'}},
        #         {'term': {'roleKey': 'executive'}},
        #         {'term': {'roleKey': 'speaker'}}
        #     ]
        # },
        # 'nested': 'roles'*/
    },
    'genres': {
        'name': 'Genres',
        'description': '',
        'ui_presentation': 'checkbox',
        'nested_filter_field': 'categoryValue',
        'terms': {
            'field': 'untouched',
            'size': 30
        },
        'facet_filter': {
            'term': {
                'categoryKey': 'genre'
            }
        },
        'nested': 'categories'
    },
    'keywords': {
        'name': 'Keywords',
        'description': '',
        'ui_presentation': 'checkbox',
        'nested_filter_field': 'categoryValue',
        'terms': {
            'field': 'untouched',
            'size': 30
        },
        'facet_filter': {
            'term': {'categoryKey': 'keyword'}
        },
        'nested': 'categories'
    },
    # This facet operates on the complete set of Twitter terms, but can be
    # very memory expensive (every term present in the text has to be kept
    # in memory)
    'tweets': {
        'name': 'Tweets',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'tweetText',
            'size': 30
        },
        'nested': 'tweets'
    },
    # This facet operates on a list of the top 100 terms extracted from Tweets
    # (generated in whatever way; that is up to the indexer), as to economize
    # on memory usage
    'top_100_twitter_terms': {
        'name': 'Tweets',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'top_100_twitter_terms',
            'size': 30
        }
    },
    # This facet operates on the complete set of subtitle terms, but can be
    # very memory expensive (every term present in the text has to be kept
    # in memory)
    'subtitles': {
        'name': 'Subtitles',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'subtitles',
            'size': 30
        }
    },
    # This facet operates on a list of the top 100 terms extracted from subtitles
    # (generated in whatever way; that is up to the indexer), as to economize
    # on memory usage
    'top_100_subtitle_terms': {
        'name': 'Subtitles',
        'description': '',
        'ui_presentation': 'checkbox',
        'terms': {
            'field': 'top_100_subtitle_terms',
            'size': 30
        }
    }
}

# List of facets that are displayed (in the different tabs) by default
DEFAULT_FACETS = ['genres', 'channels', 'producers', 'keywords', 'people',
                  'tweets', 'subtitles']

# The facet that is used for the date range slider
DEFAULT_DATE_FACET = 'broadcast_start_date'

# Defenition of sources/fields that can be used for free text searching
AVAILABLE_SEARCH_FIELDS = [
    {
        'id': 'immix',
        'name': 'iMMix metadata',
        'icon': 'icon-film',
        'fields': ['titles', 'mainTitle', 'summaries', 'descriptions']
    },
    {
        'id': 'subtitles',
        'name': 'T888 subtitles',
        'icon': 'icon-comment',
        'fields': ['subtitles']
    },
    {
        'id': 'twitter',
        'name': 'Tweets',
        'icon': 'icon-twitter',
        'fields': ['tweetText'],
        'nested': 'tweets'
    }
]

# The fields that should be returned for each hit when searching
SEARCH_HIT_FIELDS = ['mainTitle', 'broadcastDates', 'summaries']

MINIMUM_CLOUD_FONTSIZE = 10
MAXIMUM_CLOUD_FONTSIZE = 30

BARCHART_BARS = 10
BARCHART_BAR_HEIGHT = 20

# The fields that should be considered when creating highlighted snippets for
# a search result.
HIT_HIGHLIGHT_FIELDS = ['descriptions', 'summaries', 'subtitles', 'tweetText']
# The max. length of a highlighted snippet (in chars)
HIT_HIGHLIGHT_FRAGMENT_SIZE = 200
# The max. number of highlighted snippets (per field) to return
HIT_HIGHLIGHT_FRAGMENTS = 1

# Enables or disables application usage logging
ENABLE_USAGE_LOGGING = True

# Determine which events will be logged
# clicks actions:
#  submit_query: User submits a new query. Log querystring and modelName.
#  change_search_field: User adds or removes one of the collections from the search. Log modelName, the collection, and whether it has been activated or not
#  daterange_facet: User uses timeslider. Log from date in ms, to date in ms, and the model name
#  change_facet_tab: User switches tabs in facetsview. Log source and target tab
#  view_document: User clicks on a single document in result list. Log document id and model name
#  page_switch: User switches between home, about and querysyntax page. Log source and target page.
# results actions:
#  results: A result list is rendered. Log the visible doc_ids and model name.
LOG_EVENTS = ['clicks', 'results']

# The URL to the JSON file that contains the (textual) information
# displayed on the 'about' page
ABOUT_PAGE_CONTENT_URL = 'static/about.json'

# URL to JSON file that contains text for 'help' page
HELP_PAGE_CONTENT_URL = 'static/help.json'

# Allow all settings to be overridden by a local file that is not in
# the VCS.
try:
    from local_settings import *
except ImportError:
    pass
