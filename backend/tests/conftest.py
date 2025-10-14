import os
import sys

# Add backend/ to sys.path so tests can import `app` package
here = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(here, '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
