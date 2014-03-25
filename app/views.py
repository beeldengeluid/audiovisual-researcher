import re
import uuid
import json

from flask import request, render_template, jsonify, url_for, abort, redirect
from flask.ext.bcrypt import Bcrypt
from flask.ext.mail import Mail, Message
from flask.ext.login import (LoginManager, login_user, logout_user,
                             login_required, current_user)

from settings import (DEBUG, MESSAGES, MAIL_DEFAULT_SENDER,
                      MAIL_ACCOUNT_APPROVAL_ADDRESS, HITS_PER_PAGE,
                      ALLOWED_INTERVALS, AVAILABLE_FACETS, DEFAULT_FACETS,
                      DEFAULT_DATE_FACET, AVAILABLE_SEARCH_FIELDS,
                      SEARCH_HIT_FIELDS, MINIMUM_CLOUD_FONTSIZE,
                      MAXIMUM_CLOUD_FONTSIZE, BARCHART_BARS,
                      BARCHART_BAR_HEIGHT, HIT_HIGHLIGHT_FIELDS,
                      HIT_HIGHLIGHT_FRAGMENT_SIZE, HIT_HIGHLIGHT_FRAGMENTS,
                      ENABLE_USAGE_LOGGING, LOG_EVENTS, ES_SEARCH_INDEX,
                      ES_LOG_INDEX, ABOUT_PAGE_CONTENT_URL,
                      HELP_PAGE_CONTENT_URL)
from app import app, db, es_search, es_log
from models import User

R_EMAIL = re.compile(r'^.+@[^.].*\.[a-z]{2,10}$', re.IGNORECASE)
bcrypt = Bcrypt(app)
mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    """ Callback for reloading a user from the session. None is returned
    if the user does not exist."""
    return db.session.query(User).get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized_response():
    """ This response is returned when the user is required to log in
    (i.e. the view function is decorated with `login_required`)."""

    resp = jsonify({
        'success': False,
        'errors': [MESSAGES['login_required']]
    })
    resp.status_code = 401

    return resp


@app.route('/', methods=['GET'])
def index():
    app_settings = {
        'DEBUG': DEBUG,
        'HITS_PER_PAGE': HITS_PER_PAGE,
        'ALLOWED_INTERVALS': ALLOWED_INTERVALS,
        'AVAILABLE_FACETS': AVAILABLE_FACETS,
        'DEFAULT_FACETS': DEFAULT_FACETS,
        'DEFAULT_DATE_FACET': DEFAULT_DATE_FACET,
        'AVAILABLE_SEARCH_FIELDS': AVAILABLE_SEARCH_FIELDS,
        'SEARCH_HIT_FIELDS': SEARCH_HIT_FIELDS,
        'MINIMUM_CLOUD_FONTSIZE': MINIMUM_CLOUD_FONTSIZE,
        'MAXIMUM_CLOUD_FONTSIZE': MAXIMUM_CLOUD_FONTSIZE,
        'BARCHART_BARS': BARCHART_BARS,
        'BARCHART_BAR_HEIGHT': BARCHART_BAR_HEIGHT,
        'HIT_HIGHLIGHT_FIELDS': HIT_HIGHLIGHT_FIELDS,
        'HIT_HIGHLIGHT_FRAGMENTS': HIT_HIGHLIGHT_FRAGMENTS,
        'HIT_HIGHLIGHT_FRAGMENT_SIZE': HIT_HIGHLIGHT_FRAGMENT_SIZE,
        'HELP_PAGE_CONTENT_URL': HELP_PAGE_CONTENT_URL,
        'ABOUT_PAGE_CONTENT_URL': ABOUT_PAGE_CONTENT_URL,
        'ENABLE_USAGE_LOGGING': ENABLE_USAGE_LOGGING,
        'LOG_EVENTS': LOG_EVENTS,
        'AUTHENTICATED_USER': False,
        'USER': None
    }

    if current_user.is_authenticated():
        app_settings['AUTHENTICATED_USER'] = True
        app_settings['USER'] = {
            'name': current_user.name,
            'organization': current_user.organization,
            'email': current_user.email
        }

    return render_template('index.html', settings=app_settings)


@app.route('/verify_email/<int:user_id>/<token>')
def verify_email(user_id, token):
    """ When visited with a valid `user_id` and `token` combination,
    the user's mailaddress is marked as 'verified'. The person
    responsible for approving accounts will recieve an email about the
    new registration with a link to approve the account."""

    user = db.session.query(User)\
        .filter_by(id=user_id, email_verification_token=token).first()

    # If the user_id <-> token combination does not exist, return a 401
    if not user:
        abort(401)

    # Mark mailaddress as verified
    user.email_verified = True
    db.session.add(user)
    db.session.commit()

    # Send email to mailadres responsible for approving accounts
    approve_url = '%savresearcher/approve_user/%s/%s' % (request.url_root, user.id,
                                                user.approval_token)

    msg = Message(MESSAGES['email_approval_subject'],
                  sender=MAIL_DEFAULT_SENDER,
                  recipients=[MAIL_ACCOUNT_APPROVAL_ADDRESS])

    msg.body = MESSAGES['email_approval_body'] % (user.name, user.organization,
                                                  user.email, approve_url)
    mail.send(msg)

    messages = {
        'email_verified_title': MESSAGES['email_verified_title'] % user.name,
        'email_verified_content': MESSAGES['email_verified_content']
    }
    return render_template('verify_email.html', **messages)


@app.route('/approve_user/<int:user_id>/<token>')
def approve_user(user_id, token):
    """ When visited with a valid `user_id` and `token` combination, the
    user's account is marked as 'approved'. An email notification of
    this approval will be send to the user."""

    user = db.session.query(User)\
        .filter_by(id=user_id, approval_token=token, email_verified=True).first()

    if not user:
        abort(401)

    # Mark account as approved
    user.approved = True
    db.session.add(user)
    db.session.commit()

    # Notify the user of approval by email
    msg = Message(MESSAGES['email_approved_subject'],
                  sender=MAIL_DEFAULT_SENDER, recipients=[user.email])

    msg.body = MESSAGES['email_approved_body'] % (user.name, request.url_root + 'avresearcher/')

    mail.send(msg)

    return render_template('approve_user.html', user=user,
                           user_approved_title=MESSAGES['user_approved_title']
                           % user.name)


@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user account."""
    errors = []

    # Return errors when required fields are not provided or empty
    required_field = ['name', 'email', 'password']
    for field in required_field:
        if field not in request.form or len(request.form[field].strip()) < 1:
            errors.append(MESSAGES['missing_%s' % field])

    # Verify if the email address is valid
    if not R_EMAIL.match(request.form['email']):
        errors.append(MESSAGES['invalid_email'])

    # Check if there is not already a user with the same mail address
    dupe_mail = db.session.query(User).filter_by(
        email=request.form['email']).first()
    if dupe_mail:
        errors.append(MESSAGES['account_already_exists'])

    if errors:
        return jsonify({'success': False, 'errors': errors})

    # Hash the provided password
    password = bcrypt.generate_password_hash(request.form['password'], 12)

    # Create the user record
    user = User(
        email=request.form['email'],
        password=password,
        name=request.form['name'],
        email_verification_token=str(uuid.uuid4()),
        approval_token=str(uuid.uuid4())
    )

    # Add the user's org., if provided
    if 'organization' in request.form and\
            len(request.form['organization'].strip()) > 1:
        user.organization = request.form['organization'].strip()

    db.session.add(user)
    db.session.commit()

    # Send account activation e-mail
    verification_url = '%savresearcher/verify_email/%s/%s' % (request.url_root, user.id,
                                                     user.email_verification_token)

    msg = Message(MESSAGES['email_verification_subject'],
                  sender=MAIL_DEFAULT_SENDER,
                  recipients=[request.form['email']])
    msg.body = MESSAGES['email_verification_body']\
        % (request.form['name'], verification_url)
    mail.send(msg)

    return jsonify({'success': True})


@app.route('/api/login', methods=['POST'])
def login():
    """Login the user."""
    errors = []

    # Return errors when required fields are not provided or empty
    required_field = ['email', 'password']
    for field in required_field:
        if field not in request.form or len(request.form[field].strip()) < 1:
            errors.append(MESSAGES['missing_%s' % field])

    if errors:
        return jsonify({'success': False, 'errors': errors})

    # Fetch the user from the db
    user = db.session.query(User).filter_by(email=request.form['email']).first()
    if not user:
        return jsonify({'success': False, 'errors': [MESSAGES['login_failed']]})

    # Validate password
    if not bcrypt.check_password_hash(user.password, request.form['password']):
        return jsonify({
            'success': False,
            'errors': [MESSAGES['login_failed']]
        })

    # Check if the user has verified his email address
    if not user.email_verified:
        return jsonify({
            'success': False,
            'errors': [MESSAGES['email_not_verified']]
        })

    # Check if staff already approved this account
    if not user.approved:
        return jsonify({
            'success': False,
            'errors': [MESSAGES['account_not_approved']]
        })

    # This must be a valid user, log the user in!
    login_user(user)

    return jsonify({
        'success': True,
        'user': {
            'name': user.name,
            'organization': user.organization,
            'email': user.email
        }
    })


@app.route('/api/logout', methods=['GET'])
@login_required
def logout():
    """Logs out the user by deleting the session."""
    logout_user()

    return jsonify({'success': True})


@app.route('/api/search', methods=['POST'])
@login_required
def search():
    payload = json.loads(request.form['payload'])
    results = es_search.search(index=ES_SEARCH_INDEX, body=payload)
    return jsonify(results)


@app.route('/api/count', methods=['POST'])
@login_required
def count():
    payload = json.loads(request.form['payload'])
    results = es_search.count(index=ES_SEARCH_INDEX, body=payload)

    return jsonify(results)


@app.route('/api/log_usage', methods=['POST'])
@login_required
def log_usage():
    events = json.loads(request.form['events'])
    user_id = current_user.id
    
    bulkrequest = ''
    # Add the user's ID to each event
    for event in events:
        event['user_id'] = user_id
        bulkrequest = bulkrequest + '\n' + '{ "create" : { "_index" : "' +  ES_LOG_INDEX + '", "_type" : "event" } }'
        bulkrequest = bulkrequest + '\n' + json.dumps(event); 

    es_log.bulk(bulkrequest, index=ES_LOG_INDEX, doc_type='event')

    return jsonify({'success': True})
    