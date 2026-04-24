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
    # Bahar list mein kya kya dikhega
    list_display = ('id', 'first_name', 'phone_number', 'city', 'gender', 'is_premium_status', 'created_at')
    
    # Right side mein filter karne ke options (Jaise sirf VIP users dekhna, ya sirf ladkiyan dekhna)
    list_filter = ('is_premium', 'gender', 'intent', 'drinking_habit')
    
    # Search bar (Naam ya phone number se dhoondhne ke liye)
    search_fields = ('first_name', 'phone_number', 'city')
    
    # Data ko groups mein bantna taaki andar ka view clean lage
    fieldsets = (
        ('Basic Info', {
            'fields': ('phone_number', 'first_name', 'last_name', 'dob', 'gender')
        }),
        ('Lifestyle & Vibe', {
            'fields': ('city', 'college', 'job_title', 'drinking_habit', 'intent', 'interests', 'bio')
        }),
        ('VIP & Premium Control', {
            'fields': ('is_premium', 'premium_expiry'),
            'description': 'Yahan se aap manually kisi ko VIP bana sakte hain.'
        }),
        ('User Photos', {
            'fields': ('profile_pic_1', 'profile_pic_2', 'profile_pic_3', 'profile_pic_4', 'profile_pic_5', 'profile_pic_6')
        }),
    )

    # Custom Badge for Premium Users
    def is_premium_status(self, obj):
        if obj.is_premium:
            return format_html('<span style="color: white; background: #f5b748; padding: 3px 10px; border-radius: 10px; font-weight: bold;">VIP 👑</span>')
        return format_html('<span style="color: gray;">Free User</span>')
    is_premium_status.short_description = "Account Status"

    # --- ADMIN ACTIONS (Bulk actions) ---
    actions = ['make_vip_1_month', 'remove_vip']

    def make_vip_1_month(self, request, queryset):
        expiry = timezone.now() + timedelta(days=30)
        updated = queryset.update(is_premium=True, premium_expiry=expiry)
        self.message_user(request, f"{updated} users ko 1 Month ka VIP de diya gaya hai! 🎉")
    make_vip_1_month.short_description = "Grant 1 Month VIP 👑"

    def remove_vip(self, request, queryset):
        updated = queryset.update(is_premium=False, premium_expiry=None)
        self.message_user(request, f"{updated} users se VIP wapas le liya gaya hai.")
    remove_vip.short_description = "Remove VIP Access 🚫"


# ==========================================
# 2. SAFETY & MODERATION (Reports & Blocks)
# ==========================================
@admin.register(BlockList)
class BlockListAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked_user', 'timestamp', 'reason')
    search_fields = ('blocker__first_name', 'blocked_user__first_name', 'blocker__phone_number')
    list_filter = ('timestamp',)
    readonly_fields = ('timestamp',)
    
    # Custom display: Kaun kisko block kar raha hai
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('blocker', 'blocked_user')


# ==========================================
# 3. SWIPE ACTIVITY MONITORING
# ==========================================
@admin.register(Swipe)
class SwipeAdmin(admin.ModelAdmin):
    list_display = ('swiper', 'swiped_on', 'swipe_type', 'timestamp')
    list_filter = ('is_like', 'is_superlike', 'timestamp')
    search_fields = ('swiper__first_name', 'swiped_on__first_name')
    
    # Sirf dekhne ke liye, Admin swipe thodi na change karega
    readonly_fields = ('swiper', 'swiped_on', 'is_like', 'is_superlike', 'timestamp')

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
# 5. CHAT MONITORING (Privacy Ke Saath)
# ==========================================
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'match', 'timestamp', 'is_read', 'is_deleted')
    search_fields = ('sender__first_name', 'content')
    list_filter = ('timestamp', 'is_read', 'is_deleted')
    
    # Privacy maintain karne ke liye, admin by default message edit nahi kar sakta
    readonly_fields = ('match', 'sender', 'content', 'image', 'timestamp')

    # Agar admin app header ka naam change karna chahe:
    admin.site.site_header = "PulseDate Super Admin 🚀"
    admin.site.site_title = "PulseDate Control Panel"
    admin.site.index_title = "Welcome to PulseDate Dashboard"