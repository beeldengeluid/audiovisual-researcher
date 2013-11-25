from app import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(60), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    organization = db.Column(db.String(255))
    email_verified = db.Column(db.Boolean, nullable=False)
    approved = db.Column(db.Boolean, nullable=False)
    email_verification_token = db.Column(db.String(36), nullable=False)
    approval_token = db.Column(db.String(36), nullable=False)
    created_on = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    updated_on = db.Column(db.DateTime, default=db.func.now(),
                           onupdate=db.func.now(), nullable=False)

    def __init__(self, email, password, name, email_verification_token,
                 approval_token, organization=None, email_verified=False,
                 approved=False):
        self.email = email
        self.password = password
        self.name = name
        self.organization = organization
        self.email_verified = email_verified
        self.approved = approved
        self.email_verification_token = email_verification_token
        self.approval_token = approval_token

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):
        return '<User %r>' % self.email
