import os
from flask import Flask
from dotenv import load_dotenv
from .extensions import mongo, jwt
from flask_cors import CORS

load_dotenv()

def create_app():
	app = Flask(__name__)
	app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/projectdb")
	app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret")

	mongo.init_app(app)
	jwt.init_app(app)
	CORS(app, origins=["http://localhost:5173"])  # allow frontend dev server

	# register blueprints (auth might be added later)
	try:
		from .routes.auth import auth_bp
		app.register_blueprint(auth_bp, url_prefix="/api/auth")
	except Exception:
		pass

	from .routes.projects import projects_bp
	from .routes.hardware import hardware_bp
	app.register_blueprint(projects_bp, url_prefix="/api/projects")
	app.register_blueprint(hardware_bp, url_prefix="/api/hardware")

	return app

