from datetime import date  # <-- Yeh add karein
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import UserProfile, Swipe, Match  # Match ko add karna zaroori hai
from .models import Message, Match
from .serializers import MessageSerializer
from .models import UserProfile, Swipe, Match, Message, BlockList, Transaction
import razorpay
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.db import models
import random
import requests
from .models import OTPRecord

# Apne keys yahan dalein
client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET')))

@api_view(['POST'])
def create_order(request):
    """
    Frontend se jo plan ka price aayega, utne ka order banayega.
    """
    # React se amount aayega, agar nahi aaya toh default 499
    amount = request.data.get('amount', 499) 
    
    data = { "amount": int(amount * 100), "currency": "INR", "receipt": "order_rcptid_11" }
    order = client.order.create(data=data)
    return Response(order)

# views.py - verify_payment function ko replace karein
@api_view(['POST'])
def verify_payment(request):
    data = request.data
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        })
        
        user_id = data.get('user_id')
        months = int(data.get('months', 1))
        amount = float(data.get('amount', 499)) # Frontend se amount bhi bhejna hoga

        user = UserProfile.objects.get(id=user_id)
        user.is_premium = True
        user.premium_expiry = timezone.now() + timedelta(days=30 * months)
        user.save()

        # 👇 TRANSACTION SAVE KARO 👇
        Transaction.objects.create(
            user=user,
            razorpay_order_id=data.get('razorpay_order_id'),
            razorpay_payment_id=data.get('razorpay_payment_id'),
            amount=amount,
            plan_months=months
        )
        
        return Response({"message": "Payment Successful & Recorded! 🎉"})
    except Exception as e:
        return Response({"error": "Payment Verification Failed!"}, status=400)
    
@api_view(['GET'])
def test_connection(request):
    """
    Basic API to test if the Django backend is connected to the React frontend.
    """
    return Response({"message": "Backend Connected! Hello Farhan."})

@api_view(['POST'])
def login_user(request):
    """
    Handles User Authentication (Login and Signup).
    Checks the database for existing phone numbers based on the selected mode.
    """
    phone = request.data.get('phone_number')
    mode = request.data.get('mode')
    
    if not phone:
        return Response({"error": "Phone number is required."}, status=400)
        
    user_exists = UserProfile.objects.filter(phone_number=phone).exists()
    
    if mode == 'login':
        if user_exists:
            user = UserProfile.objects.get(phone_number=phone)
            return Response({"message": "Login successful! Welcome back.", "user_id": user.id})
        else:
            return Response({"error": "Account not found. Please sign up first."}, status=404)
            
    elif mode == 'signup':
        if user_exists:
            return Response({"error": "This number is already registered. Please log in."}, status=400)
        else:
            user = UserProfile.objects.create(phone_number=phone)
            return Response({"message": "New account created successfully!", "user_id": user.id})
            
    else:
        return Response({"error": "System Error: Mode not provided or recognized."}, status=400)

@api_view(['POST'])
def update_profile(request):
    """
    API endpoint to update all user details including photos.
    Uses request.data to capture both text and file data.
    """
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({"error": "User ID is required."}, status=400)
        
    try:
        user = UserProfile.objects.get(id=user_id)
        
        # Updating Text Fields
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)        
        user.gender = request.data.get('gender', user.gender)
        user.city = request.data.get('city', user.city)
        user.interested_in = request.data.get('interested_in', user.interested_in)
        user.drinking_habit = request.data.get('drinking_habit', user.drinking_habit)
        user.college = request.data.get('college', user.college)
        user.job_title = request.data.get('job_title', user.job_title)
        user.intent = request.data.get('intent', user.intent)
        user.interests = request.data.get('interests', user.interests)
        user.bio = request.data.get('bio', user.bio)
        user.dob = request.data.get('dob', user.dob)
        
        # Updating Image Fields (if files are provided in the request)
       # Sabhi 6 photos ke liye loop (Puraane photo_1, photo_2 wale if blocks hata dein)
        for i in range(1, 7):
            key = f'photo_{i}'
            if key in request.FILES:
                setattr(user, f'profile_pic_{i}', request.FILES[key])
        
        user.save()
        return Response({"message": "Profile details and photos saved successfully!"})
        
    except UserProfile.DoesNotExist:
        return Response({"error": "User account not found."}, status=404)

@api_view(['GET'])
def get_profile(request, user_id):
    """
    API endpoint to fetch user details for the Dashboard.
    """
    try:
        user = UserProfile.objects.get(id=user_id)
        
        # Creating a dictionary of user data to send to React
      # Creating a dictionary of user data to send to React
        data = {
            "first_name": user.first_name,
            "last_name": user.last_name, # 👈 Add this
            "phone_number": user.phone_number, # 👈 Add this
            "dob": user.dob, # 👈 Add this
            "city": user.city,
            "job_title": user.job_title,
            "intent": user.intent,
            "bio": user.bio,
            "interests": user.interests,
            
            # 👇 YEH 5 NAYI LINES ADD KAREIN 👇
            "college": user.college,             
            "drinking_habit": user.drinking_habit,
            "dob": user.dob,                     
            "gender": user.gender,               
            "interested_in": user.interested_in, 
            "is_premium": user.is_premium,
            
            "photo_1": user.profile_pic_1.url if user.profile_pic_1 else None,
            "photo_2": user.profile_pic_2.url if user.profile_pic_2 else None,
            "photo_1": user.profile_pic_1.url if user.profile_pic_1 else None,
            "photo_2": user.profile_pic_2.url if user.profile_pic_2 else None,
            "photo_3": user.profile_pic_3.url if user.profile_pic_3 else None,
            "photo_4": user.profile_pic_4.url if user.profile_pic_4 else None,
            "photo_5": user.profile_pic_5.url if user.profile_pic_5 else None,
            "photo_6": user.profile_pic_6.url if user.profile_pic_6 else None,
        }
        return Response(data)
        
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found."}, status=404)
    
@api_view(['GET'])
def get_discovery_profiles(request, user_id):
    """
    Yeh API un users ko fetch karegi jinko current user ne abhi tak swipe nahi kiya hai,
    aur jo Preferences (Age, Gender) se match karte hain.
    """
    try:
        # Frontend se Filters receive karo (agar nahi aaye toh default value set karo)
        max_age = int(request.GET.get('age', 60))
        gender_pref = request.GET.get('gender', 'Everyone')

        # 1. Un logon ki ID nikalo jinko current user pehle hi swipe kar chuka hai
        swiped_users = Swipe.objects.filter(swiper_id=user_id).values_list('swiped_on_id', flat=True)

        # 2. Base Query: Khud ko aur swiped users ko hatao
        profiles_query = UserProfile.objects.exclude(id=user_id).exclude(id__in=swiped_users)

        # 3. GENDER FILTER: 'Women' ko 'Woman' se aur 'Men' ko 'Man' se match karo
        if gender_pref == 'Women':
            profiles_query = profiles_query.filter(gender='Woman')
        elif gender_pref == 'Men':
            profiles_query = profiles_query.filter(gender='Man')

        # Abhi ke liye 15 profiles uthate hain, baad mein age check karke filter karenge
        profiles = profiles_query[:15] 

        data = []
        for p in profiles:
            # 4. AGE FILTER & Calculation
            age = 22 # Default age
            if p.dob:
                today = date.today()
                age = today.year - p.dob.year - ((today.month, today.day) < (p.dob.month, p.dob.day))

            # Agar is user ki age humare slider ki max age se zyada hai, toh isko list mein mat daalo
            if age > max_age:
                continue

            # Photos ko array mein daalo
            photos = []
            base_url = "http://127.0.0.1:8000"
            if p.profile_pic_1: photos.append(base_url + p.profile_pic_1.url)
            if p.profile_pic_2: photos.append(base_url + p.profile_pic_2.url)
            if p.profile_pic_3: photos.append(base_url + p.profile_pic_3.url)
            if p.profile_pic_4: photos.append(base_url + p.profile_pic_4.url)
            if p.profile_pic_5: photos.append(base_url + p.profile_pic_5.url)
            if p.profile_pic_6: photos.append(base_url + p.profile_pic_6.url)

            if not photos:
                photos = ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"]

            data.append({
                "id": p.id,
                "name": p.first_name or "Unknown",
                "age": age,
                "verified": p.is_verified,
                "city": p.city or "Unknown City",
                "job": p.job_title or "Jobless",
                "intent": p.intent or "🤔 Still figuring it out",
                "drinking": p.drinking_habit or "Not specified",
                "bio": p.bio or "Hey there! Let's connect.",
                "interests": p.interests.split(', ') if p.interests else [],
                "photos": photos
            })

        return Response(data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['POST'])
def record_swipe(request):
    swiper_id = request.data.get('swiper_id')
    swiped_on_id = request.data.get('swiped_on_id')
    
    # 👇 NAYA ULTIMATE FIX: React kisi bhi naam se data bheje, ye pakad lega! 👇
    is_like = (
        str(request.data.get('is_like', '')).lower() in ['true', '1', 'yes', 't'] or 
        str(request.data.get('direction', '')).lower() == 'right' or 
        str(request.data.get('action', '')).lower() == 'like'
    )
    
    is_superlike = (
        str(request.data.get('is_superlike', '')).lower() in ['true', '1', 'yes', 't'] or 
        str(request.data.get('direction', '')).lower() == 'up' or
        str(request.data.get('action', '')).lower() == 'superlike'
    )

    # Agar Superlike kiya hai (Up Swipe), toh Like toh of course hoga hi
    if is_superlike:
        is_like = True

    try:
        swiper = UserProfile.objects.get(id=swiper_id)
        swiped_on = UserProfile.objects.get(id=swiped_on_id)

        # Swipe database mein save karo
        swipe, created = Swipe.objects.get_or_create(
            swiper=swiper,
            swiped_on=swiped_on,
            defaults={'is_like': is_like, 'is_superlike': is_superlike}
        )

        # Update karo agar pehle pass kiya tha ab like kar raha hai
        if not created: 
            swipe.is_like = is_like
            swipe.is_superlike = is_superlike
            swipe.save()

        match_created = False
        match_id = None  
        
        # Agar is_like True hai, tabhi Match check hoga
        if is_like:
            reverse_swipe = Swipe.objects.filter(
                swiper=swiped_on, 
                swiped_on=swiper, 
                is_like=True
            ).exists()
            
            if reverse_swipe:
                new_match, is_new = Match.objects.get_or_create(user1=swiper, user2=swiped_on)
                match_created = True
                match_id = new_match.id  

        return Response({
            "message": "Swipe saved successfully!", 
            "match": match_created,
            "match_id": match_id
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)
@api_view(['GET'])
def get_sidebar_data(request, user_id):
    """
    Sidebar ke liye 'Matches' aur 'Liked You' ka asali data fetch karta hai.
    """
    try:
        user = UserProfile.objects.get(id=user_id)
        base_url = "http://127.0.0.1:8000"

        # 1. Asali Matches Dhoondo
        matches = Match.objects.filter(Q(user1=user) | Q(user2=user))
        match_list = []
        for m in matches:
            other_user = m.user2 if m.user1 == user else m.user1
            photo_url = base_url + other_user.profile_pic_1.url if other_user.profile_pic_1 else "/default-avatar.png"
            match_list.append({
                "id": other_user.id,
                "match_id": m.id,  # 👇 YEH LINE MISSING THI! Iske bina React confuse tha.
                "name": other_user.first_name or "Unknown",
                "photo": photo_url
            })

        # 2. Liked You Dhoondo (Jinhone Like kiya hai, par Match nahi hua)
        liked_me_swipes = Swipe.objects.filter(swiped_on=user, is_like=True)
        my_swipes = Swipe.objects.filter(swiper=user).values_list('swiped_on_id', flat=True)

        likes = liked_me_swipes.exclude(swiper_id__in=my_swipes)

        # Liked You List update karein
        liked_you_list = []
        for l in likes:
            u = l.swiper # Jisne aapko like kiya
            
            # Age calculate karna
            age = 0
            if u.dob:
                from datetime import date
                today = date.today()
                age = today.year - u.dob.year - ((today.month, today.day) < (u.dob.month, u.dob.day))

            liked_you_list.append({
                "id": u.id,
                "name": u.first_name or "Someone",
                "age": age,
                "city": u.city or "Unknown",
                "job": u.job_title or "Private",
                "bio": u.bio or "",
                "intent": u.intent or "Looking for connection",
                "drinking": u.drinking_habit or "Socially",
                "interests": u.interests.split(', ') if u.interests else [],
                "photo": f"http://127.0.0.1:8000{u.profile_pic_1.url}" if u.profile_pic_1 else "/default-avatar.png",
                "photos": [
                    f"http://127.0.0.1:8000{u.profile_pic_1.url}" if u.profile_pic_1 else None,
                    f"http://127.0.0.1:8000{u.profile_pic_2.url}" if u.profile_pic_2 else None,
                    f"http://127.0.0.1:8000{u.profile_pic_3.url}" if u.profile_pic_3 else None,
                    f"http://127.0.0.1:8000{u.profile_pic_4.url}" if u.profile_pic_4 else None,
                    f"http://127.0.0.1:8000{u.profile_pic_5.url}" if u.profile_pic_5 else None,
                    f"http://127.0.0.1:8000{u.profile_pic_6.url}" if u.profile_pic_6 else None,
                ],
                "is_superlike": getattr(l, 'is_superlike', False)
            })

        return Response({
            "matches": match_list,
            "liked_you": liked_you_list
        })
    except Exception as e:
        print(f"Sidebar API Error: {str(e)}") 
        return Response({"error": str(e)}, status=400)
    
@api_view(['GET', 'POST'])
def chat_messages(request, match_id): 
    # 👇 NAYA: Ab 'match_id' sach mein Match table ki ID hai!
    current_user_id = request.GET.get('user_id')
    if request.method == 'POST':
        current_user_id = request.data.get('sender_id')

    if not current_user_id:
        return Response({"error": "User ID missing"}, status=400)

    # 👇 ASLI FIX YAHAN HAI: Match dhoondne ka tarika theek kiya
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response({"error": "Match nahi mila!"}, status=404)

   # 1. Purane messages fetch karna
    if request.method == 'GET':
        # Samne wale ka ID nikalna taaki uske bheje messages ko Read kar sakein
        other_user_id = match.user2.id if match.user1.id == int(current_user_id) else match.user1.id
        
        # NAYA: Samne wale ke saare unread messages ko Read (True) kar do
        Message.objects.filter(match=match, sender_id=other_user_id, is_read=False).update(is_read=True)        
        
        messages = Message.objects.filter(match=match).exclude(hidden_by_user=int(current_user_id)).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    # Naya message send karna
    elif request.method == 'POST':
        content = request.data.get('content')
        message = Message.objects.create(
            match=match,
            sender_id=current_user_id,
            content=content
        )
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=201)
    
@api_view(['GET'])
def get_chat_list(request, user_id):
    matches = Match.objects.filter(Q(user1_id=user_id) | Q(user2_id=user_id))
    chat_list_data = []

    for match in matches:
        other_user = match.user2 if match.user1.id == int(user_id) else match.user1
        last_msg = Message.objects.filter(match=match).exclude(hidden_by_user=int(user_id)).order_by('-timestamp').first()
        
        # match_id yahan se jayegi tabhi React use pakad payega
        chat_list_data.append({
            'match_id': match.id,  # 👈 YEH LINE MISSING THI
            'other_user_id': other_user.id,
            'name': other_user.first_name,
            'photo': f"http://127.0.0.1:8000{other_user.profile_pic_1.url}" if other_user.profile_pic_1 else '/default-avatar.png',
            'last_message': last_msg.content if last_msg else "No messages yet",
            'last_message_time': last_msg.timestamp if last_msg else match.matched_at,
            'is_read': last_msg.is_read if last_msg else False,
            'sender_id': last_msg.sender.id if last_msg else None,
            'unread_count': Message.objects.filter(match=match, sender=other_user, is_read=False).count()
        })

    chat_list_data.sort(key=lambda x: x['last_message_time'], reverse=True)
    return Response(chat_list_data)

@api_view(['POST'])
def block_user(request):
    """
    Blocks a user and deletes their match record so they can't chat anymore.
    """
    blocker_id = request.data.get('blocker_id')
    blocked_id = request.data.get('blocked_id')
    
    if not blocker_id or not blocked_id:
        return Response({"error": "IDs missing"}, status=400)
        
    try:
        # 1. Block list mein daal do
        BlockList.objects.get_or_create(blocker_id=blocker_id, blocked_user_id=blocked_id)
        
        # 2. Inka Match hamesha ke liye delete kar do
        Match.objects.filter(
            (Q(user1_id=blocker_id) & Q(user2_id=blocked_id)) |
            (Q(user1_id=blocked_id) & Q(user2_id=blocker_id))
        ).delete()
        
        return Response({"message": "User blocked successfully and match removed."})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def get_blocked_users(request, user_id):
    """
    Settings me dikhane ke liye blocked users ki list bhejta hai.
    """
    try:
        blocks = BlockList.objects.filter(blocker_id=user_id)
        blocked_list = []
        for block in blocks:
            blocked_list.append({
                'id': block.blocked_user.id,
                'name': block.blocked_user.first_name,
                'photo': f"http://127.0.0.1:8000{block.blocked_user.profile_pic_1.url}" if block.blocked_user.profile_pic_1 else "/default-avatar.png"
            })
        return Response(blocked_list)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def unblock_user(request):
    """
    User ko unblock karta hai aur wapas Match bana deta hai taaki chat kar sakein.
    """
    blocker_id = request.data.get('blocker_id')
    blocked_id = request.data.get('blocked_id')
    
    try:
        # 1. Block list se hatao
        BlockList.objects.filter(blocker_id=blocker_id, blocked_user_id=blocked_id).delete()
        
        # 2. Wapas Match bana do
        Match.objects.get_or_create(user1_id=blocker_id, user2_id=blocked_id)
        
        return Response({"message": "User unblocked successfully! They are back in your matches."})
    except Exception as e:
        return Response({"error": str(e)}, status=500)    
# views.py ke sabse end mein yeh paste karein

@api_view(['GET'])
def get_admin_data(request):
    try:
        # 1. REAL USERS DATA FETCH KARNA
        users = UserProfile.objects.all().order_by('-id')
        user_list = []
        for u in users:
            age = 0
            if u.dob:
                today = date.today()
                age = today.year - u.dob.year - ((today.month, today.day) < (u.dob.month, u.dob.day))
            
            user_list.append({
                "id": u.id,
                "name": u.first_name or "Unknown",
                "age": age,
                "gender": u.gender or "N/A",
                "city": u.city or "Unknown",
                "is_premium": u.is_premium,
                "is_banned": getattr(u, 'is_banned', False), # 👈 YEH LINE JODIEN
                "is_verified": getattr(u, 'is_verified', False), # 👈 YEH NAYI LINE
                "photo": f"http://127.0.0.1:8000{u.profile_pic_1.url}" if u.profile_pic_1 else "/default-avatar.png"
            })

        # 2. REAL STATS (DABBE) CALCULATE KARNA
        total_users = users.count()
        active_vips = users.filter(is_premium=True).count()
        total_matches = Match.objects.count()
        today = timezone.now().date()
        daily_active = users.filter(last_login=today).count()

        # 3. REAL GRAPH DATA (Pichle 7 Din Ka)
        engagement_data = []
        today = timezone.now().date()
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_name = day_date.strftime("%a") # Mon, Tue, Wed etc.
            
            # Us din kitne swipes aur matches huye
            swipes_count = Swipe.objects.filter(timestamp__date=day_date).count()
            matches_count = Match.objects.filter(matched_at__date=day_date).count()
            
            engagement_data.append({
                "day": day_name,
                "swipes": swipes_count,
                "matches": matches_count
            })

        return Response({
            "users": user_list,
            "stats": {
                "totalUsers": total_users,
                "activeVIPs": active_vips,
                "totalMatches": total_matches,
                "dau": daily_active, # 👈 YEH NAYA BHEJA
                "revenue": f"₹{active_vips * 499}"
            },
            "graphData": engagement_data  # 👈 Yeh naya data graph ke liye hai
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)
# ==========================================
# ADMIN PANEL APIS (Make VIP & Block/Unblock)
# ==========================================

@api_view(['POST'])
def admin_toggle_vip(request):
    """Admin panel se VIP toggle karne aur Finance tab ko clean rakhne ke liye"""
    user_id = request.data.get('user_id')
    try:
        user = UserProfile.objects.get(id=user_id)
        
        if not user.is_premium:
            # --- VIP ACTIVATE KARO ---
            user.is_premium = True
            user.premium_expiry = timezone.now() + timedelta(days=30)
            user.save()

            # 👇 NAYA: Check karo pehle se entry hai ya nahi (taaki duplicate na ho)
            Transaction.objects.get_or_create(
                user=user,
                razorpay_order_id="MANUAL_GRANT",
                defaults={
                    'razorpay_payment_id': "BY_ADMIN",
                    'amount': 0,
                    'plan_months': 1
                }
            )
            message = "VIP Activated & Added to Finance"
        else:
            # --- VIP DEACTIVATE KARO ---
            user.is_premium = False
            user.premium_expiry = None
            user.save()

            # 👇 NAYA: Jab VIP hataya jaye, toh manual entry ko delete kardo taaki list saaf rahe
            Transaction.objects.filter(user=user, razorpay_order_id="MANUAL_GRANT").delete()
            message = "VIP Removed & Finance Log Cleared"

        return Response({"message": message, "is_premium": user.is_premium})
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['POST'])
def admin_toggle_block(request):
    """Admin panel se kisi ko Ban (Block) ya Unban karne ke liye"""
    user_id = request.data.get('user_id')
    try:
        user = UserProfile.objects.get(id=user_id)
        # Check karega ki is_banned hai ya nahi, aur usko ulta kar dega
        user.is_banned = not getattr(user, 'is_banned', False)
        user.save()
        return Response({"message": "User block status updated", "is_banned": user.is_banned})
    except Exception as e:
        return Response({"error": str(e)}, status=400)    
@api_view(['GET'])
def get_swipe_logs(request):
    try:
        swipes = Swipe.objects.all().order_by('-timestamp')[:50]
        logs = []

        for s in swipes:
            swiper_obj = s.swiper 
            target_obj = s.swiped_on 

            is_match = Match.objects.filter(user1=swiper_obj, user2=target_obj).exists() or \
                       Match.objects.filter(user1=target_obj, user2=swiper_obj).exists()

            # 👇 NAYA: Admin panel ke liye exact Action pata lagana
            if getattr(s, 'is_superlike', False):
                action = "Super Liked 🌟"
            elif getattr(s, 'is_like', False):
                action = "Liked ❤️"
            else:
                action = "Passed ❌"

            logs.append({
                "id": s.id,
                "swiper_name": swiper_obj.first_name if swiper_obj.first_name else "User",
                "target_name": target_obj.first_name if target_obj.first_name else "User",
                "swipe_type": action,
                "is_match": is_match,
                "time": s.timestamp.strftime("%d %b, %I:%M %p")
            })

        return Response(logs)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
def admin_toggle_verify(request):
    """Admin panel se kisi ko Blue Tick ✅ dene ya hatane ke liye"""
    user_id = request.data.get('user_id')
    try:
        user = UserProfile.objects.get(id=user_id)
        user.is_verified = not getattr(user, 'is_verified', False)
        user.save()
        return Response({"message": "Verification status updated", "is_verified": user.is_verified})
    except Exception as e:
        return Response({"error": str(e)}, status=400)    
    
@api_view(['GET'])
def get_admin_transactions(request):
    try:
        txns = Transaction.objects.all().order_by('-timestamp')
        data = []
        for t in txns:
            data.append({
                "id": t.id,
                "user_name": t.user.first_name,
                "amount": t.amount,
                "plan": f"{t.plan_months} Month(s)",
                "date": t.timestamp.strftime("%d %b, %Y"),
                "expiry": t.user.premium_expiry.strftime("%d %b, %Y") if t.user.premium_expiry else "N/A"
            })
        return Response(data)
    except Exception as e:
        print(f"Transaction API Error: {str(e)}") # 👈 YEH LINE ADD KAREIN taaki terminal mein error dikhe
        return Response({"error": str(e)}, status=500)   
    
@api_view(['POST'])
def send_real_otp(request):
    phone_or_email = request.data.get('phone_number') # Frontend isko 'phone_number' hi bhej raha hai
    
    if not phone_or_email:
        return Response({"error": "Email ya Phone number zaruri hai."}, status=400)
        
    otp = str(random.randint(1000, 9999)) # 4 digit OTP
    
    # Check karein ki user ne Email daala hai ya Phone Number
    is_email = '@' in phone_or_email and '.' in phone_or_email
    
    if is_email:
        # --- GMAIL SE BHEJNE KA LOGIC ---
        try:
            send_mail(
                subject='Your PulseDate Verification Code',
                message=f'Hello! Your PulseDate login code is: {otp}. Do not share this with anyone.',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[phone_or_email],
                fail_silently=False,
            )
            print(f"📧 Email sent successfully to: {phone_or_email}")
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=500)
    else:
        # --- PHONE NUMBER (TERMINAL LOGIC) ---
        if len(phone_or_email) != 10:
            return Response({"error": "Mobile number exactly 10 digits ka hona chahiye."}, status=400)
            
        print("\n" + "="*30)
        print(f"🔥 PULSEDATE OTP HACK 🔥")
        print(f"Number: {phone_or_email}")
        print(f"OTP: {otp}")
        print("="*30 + "\n")

    # OTP ko Database mein save kar lo (donon case mein chalega)
    OTPRecord.objects.update_or_create(
        phone_number=phone_or_email,
        defaults={'otp': otp, 'timestamp': timezone.now()}
    )
    
    # React ko bol do ki OTP bhej diya hai
    return Response({"message": "OTP sent successfully!"})

@api_view(['POST'])
def login_user(request):
    phone = request.data.get('phone_number')
    mode = request.data.get('mode')
    otp_entered = request.data.get('otp') # React se OTP aayega
    
    if not phone:
        return Response({"error": "Phone number is required."}, status=400)
        
    # 👇 TERMINAL WALA OTP CHECKING 👇
    if otp_entered:
        try:
            record = OTPRecord.objects.get(phone_number=phone)
            if record.otp != otp_entered:
                return Response({"error": "Invalid OTP! Terminal check karo."}, status=400)
            record.delete() # Sahi hai toh delete kar do
        except OTPRecord.DoesNotExist:
            return Response({"error": "No OTP generated for this number."}, status=400)
            
    user_exists = UserProfile.objects.filter(phone_number=phone).exists()
    
    if mode == 'login':
        if user_exists:
            user = UserProfile.objects.get(phone_number=phone)
            return Response({"message": "Login successful!", "user_id": user.id})
        else:
            return Response({"error": "Account not found. Please sign up first."}, status=404)
            
    elif mode == 'signup':
        if user_exists:
            return Response({"error": "This number is already registered. Please log in."}, status=400)
        else:
            user = UserProfile.objects.create(phone_number=phone)
            return Response({"message": "OTP Verified. Proceed to profile setup.", "user_id": user.id})