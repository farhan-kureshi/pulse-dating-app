from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import UserProfile, Swipe, Match, Message, BlockList

# ==========================================
# 1. USER MANAGEMENT (The Core Control)
# ==========================================
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # Columns visible in the list view
    list_display = ('id', 'first_name', 'phone_number', 'city', 'gender', 'is_premium_status', 'created_at')
    
    # Filter options on the right side (e.g., VIP only, specific genders)
    list_filter = ('is_premium', 'gender', 'intent', 'drinking_habit')
    
    # Search bar (Search by name or phone number)
    search_fields = ('first_name', 'phone_number', 'city')
    
    # Grouping fields to keep the detail view clean and organized
    fieldsets = (
        ('Basic Info', {
            'fields': ('phone_number', 'first_name', 'last_name', 'dob', 'gender')
        }),
        ('Lifestyle & Vibe', {
            'fields': ('city', 'college', 'job_title', 'drinking_habit', 'intent', 'interests', 'bio')
        }),
        ('VIP & Premium Control', {
            'fields': ('is_premium', 'premium_expiry_date')
        }),
        ('Photos', {
            'fields': ('photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5', 'photo_6')
        }),
    )

    # Custom column to show tick/cross for Premium status in admin panel
    def is_premium_status(self, obj):
        if obj.is_premium:
            return format_html('<span style="color: green; font-weight: bold;">✔ VIP</span>')
        return format_html('<span style="color: gray;">Regular</span>')
    
    # Column name for the custom column
    is_premium_status.short_description = 'Premium Status'


# ==========================================
# 2. BLOCKED USERS MANAGEMENT
# ==========================================
@admin.register(BlockList)
class BlockListAdmin(admin.ModelAdmin):
    list_display = ('id', 'blocker', 'blocked_user', 'timestamp')
    search_fields = ('blocker__first_name', 'blocked_user__first_name')
    list_filter = ('timestamp',)


# ==========================================
# 3. SWIPES MONITORING
# ==========================================
@admin.register(Swipe)
class SwipeAdmin(admin.ModelAdmin):
    list_display = ('id', 'swiper', 'target', 'swipe_type', 'timestamp')
    search_fields = ('swiper__first_name', 'target__first_name')
    list_filter = ('is_like', 'is_superlike', 'timestamp')

    # Custom column to show Like/Pass actions visually
    def swipe_type(self, obj):
        if obj.is_superlike:
            return format_html('<span style="color: #2196f3; font-weight: bold;">⭐ Super Like</span>')
        elif obj.is_like:
            return format_html('<span style="color: #17e27a; font-weight: bold;">❤️ Like</span>')
        return format_html('<span style="color: #fd5c63; font-weight: bold;">❌ Pass</span>')
    swipe_type.short_description = "Action"


# ==========================================
# 4. MATCHES TRACKING
# ==========================================
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'user1', 'user2', 'matched_at')
    search_fields = ('user1__first_name', 'user2__first_name')
    list_filter = ('matched_at',)
    readonly_fields = ('matched_at',)


# ==========================================
# 5. CHAT MONITORING (With Privacy)
# ==========================================
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'match', 'timestamp', 'is_read', 'is_deleted')
    search_fields = ('sender__first_name', 'content')
    list_filter = ('timestamp', 'is_read', 'is_deleted')
    
    # Maintain privacy: Admin cannot edit messages by default
    readonly_fields = ('match', 'sender', 'content', 'image', 'timestamp')