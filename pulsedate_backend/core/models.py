from django.db import models

class UserProfile(models.Model):
    """
    Main user model storing all profile details including lifestyle,
    interests, and relationship intent.
    """
    phone_number = models.CharField(max_length=15, unique=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    
    # New Fields Added for Dashboard
    city = models.CharField(max_length=100, blank=True, null=True)
    interested_in = models.CharField(max_length=20, blank=True, null=True)
    drinking_habit = models.CharField(max_length=50, blank=True, null=True)
    college = models.CharField(max_length=150, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    intent = models.CharField(max_length=50, blank=True, null=True)
    
    # Store selected interests as a comma-separated string
    interests = models.TextField(blank=True, null=True) 
    bio = models.TextField(blank=True, null=True)
    
    is_verified = models.BooleanField(default=False) # Blue Tick ke liye
    last_login = models.DateField(auto_now=True, null=True, blank=True) # Daily Active Users (DAU) ke liye
    
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)

    # Photo Fields (Handling up to 3 photos for now)
    profile_pic_1 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    profile_pic_2 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    profile_pic_3 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    profile_pic_4 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    profile_pic_5 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    profile_pic_6 = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.first_name or self.phone_number

class Swipe(models.Model):
    """
    Records right/left swipes between users.
    """
    swiper = models.ForeignKey(UserProfile, related_name='swipes_made', on_delete=models.CASCADE)
    swiped_on = models.ForeignKey(UserProfile, related_name='swipes_received', on_delete=models.CASCADE)
    is_like = models.BooleanField(default=False) # True = Right Swipe
    is_superlike = models.BooleanField(default=False) # 👇 YEH NAYI LINE ADD KAREIN 👇
    timestamp = models.DateTimeField(auto_now_add=True)

class Match(models.Model):
    """
    Records a successful match when both users swipe right.
    """
    user1 = models.ForeignKey(UserProfile, related_name='matches_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(UserProfile, related_name='matches_user2', on_delete=models.CASCADE)
    matched_at = models.DateTimeField(auto_now_add=True)
    
class Message(models.Model):
    match = models.ForeignKey(Match, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(UserProfile, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # 👇 NAYE FEATURES KE LIYE 2 NAYI LINES 👇
    reaction = models.CharField(max_length=20, null=True, blank=True) # ❤️ 😂 😮 save karne ke liye
    is_deleted = models.BooleanField(default=False) # "Delete for everyone" ke liye
    hidden_by_user = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Message from {self.sender.first_name} at {self.timestamp}"
class BlockList(models.Model):
    """
    Records when a user blocks another user.
    """
    blocker = models.ForeignKey(UserProfile, related_name='blocking', on_delete=models.CASCADE)
    blocked_user = models.ForeignKey(UserProfile, related_name='blocked_by', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('blocker', 'blocked_user')

    def __str__(self):
        return f"{self.blocker.first_name} blocked {self.blocked_user.first_name}"    
    
# models.py mein niche add karein
class Transaction(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='transactions')
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100)
    amount = models.FloatField()
    plan_months = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.first_name} - ₹{self.amount}"      
    
    
    
# models.py ke sabse end mein paste karein
class OTPRecord(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    otp = models.CharField(max_length=4)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone_number} - {self.otp}"   