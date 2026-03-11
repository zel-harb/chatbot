"""
Database models for ARIA application.

Defines the User model for storing registered users with hashed passwords.
"""

import bcrypt
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy
db = SQLAlchemy()


class User(db.Model):
    """
    User model for storing authenticated users.
    
    Attributes:
        id: Unique user identifier (primary key)
        username: Unique username for login
        email: User email address
        password_hash: Bcrypt hashed password
        created_at: Account creation timestamp
    """
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password: str) -> None:
        """
        Hash and store the password.
        
        Args:
            password: Plain text password to hash
        """
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt(rounds=10)
        ).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """
        Verify a password against the stored hash.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )
    
    def to_dict(self):
        """Return user data as dictionary (excluding password hash)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Roadmap(db.Model):
    """Saved roadmap with progress tracking."""
    __tablename__ = 'roadmaps'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), nullable=False, index=True)
    roadmap_id = db.Column(db.String(200), nullable=False)
    roadmap_data = db.Column(db.Text, nullable=False, default='{}')
    completed_items = db.Column(db.Text, nullable=False, default='[]')
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'roadmap_id', name='uq_user_roadmap'),)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'roadmap_id': self.roadmap_id,
            'roadmap_data': json.loads(self.roadmap_data),
            'completed_items': json.loads(self.completed_items),
            'updated_at': self.updated_at.isoformat()
        }


class QuizResult(db.Model):
    """Saved quiz result history."""
    __tablename__ = 'quiz_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), nullable=False, index=True)
    topic = db.Column(db.String(200))
    score = db.Column(db.Integer)
    total = db.Column(db.Integer)
    percentage = db.Column(db.Float)
    questions_data = db.Column(db.Text, default='[]')
    taken_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'topic': self.topic,
            'score': self.score,
            'total': self.total,
            'percentage': self.percentage,
            'taken_at': self.taken_at.isoformat()
        }
