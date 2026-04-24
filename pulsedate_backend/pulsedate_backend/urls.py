from django.contrib import admin
from django.urls import path
from django.conf import settings # 👈 Ye import add karein
from django.conf.urls.static import static # 👈 Ye import add karein
from core.views import test_connection, login_user, update_profile, get_profile, get_discovery_profiles, record_swipe, get_sidebar_data, chat_messages, get_chat_list
from django.conf import settings
from django.conf.urls.static import static
from core import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/test/', test_connection),
    path('api/login/', login_user),
    path('api/update-profile/', update_profile),
    path('api/get-profile/<int:user_id>/', get_profile),
    path('api/discovery/<int:user_id>/', get_discovery_profiles),
    path('api/swipe/', record_swipe),
    path('api/sidebar-data/<int:user_id>/', get_sidebar_data),
   # Chat Messages API
    path('api/chat/<int:match_id>/', chat_messages, name='chat_messages'),
    # Active Chats List API
    path('api/chat-list/<int:user_id>/', get_chat_list, name='get_chat_list'),
    path('api/block-user/', views.block_user, name='block_user'),
    path('api/blocked-users/<int:user_id>/', views.get_blocked_users, name='get_blocked_users'),
    path('api/unblock-user/', views.unblock_user, name='unblock_user'),
    path('api/create-order/', views.create_order, name='create_order'),
    path('api/verify-payment/', views.verify_payment, name='verify_payment'),
    path('api/admin-data/', views.get_admin_data, name='get_admin_data'),
    path('api/admin/toggle-vip/', views.admin_toggle_vip),
    path('api/admin/toggle-block/', views.admin_toggle_block),
    path('api/admin/swipe-logs/', views.get_swipe_logs),
    path('api/admin/toggle-verify/', views.admin_toggle_verify, name='admin_toggle_verify'),
    path('api/admin/transactions/', views.get_admin_transactions),
]

# 👇 Ye line end mein add karein 👇
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)