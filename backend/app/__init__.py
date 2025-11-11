import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv
from .extensions import mongo, jwt
from flask_cors import CORS

load_dotenv()

def create_app():
    app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb+srv://danielmciver99:P0nt1l0nt@cluster0.zb8q0td.mongodb.net/?appName=Cluster0")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "password")

    mongo.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["*"])

    # register blueprints
    try:
        from .routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
    except Exception:
        pass

    from .routes.projects import projects_bp
    from .routes.hardware import hardware_bp
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(hardware_bp, url_prefix="/api/hardware")

    # ---- Moved these ABOVE the return ----
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory(app.static_folder, "index.html")

    return app
