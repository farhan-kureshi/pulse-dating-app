import os
from django.core.asgi import get_asgi_application

# 1. Sabse pehle settings ka raasta batao
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pulsedate_backend.settings')

# 2. Django engine ko start karo (Yeh line BOHT zaruri hai routing se pehle)
django_asgi_app = get_asgi_application()

# 3. Ab Routing aur Middleware imports karo (Django start hone ke BAAAD)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import core.routing

# 4. Final Application setup
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})