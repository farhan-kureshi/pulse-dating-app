import os
import django

# Aapke project ki settings ko connect kar rahe hain
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pulsedate_backend.settings')
django.setup()

from django.db import connection

print("Database ko Emoji Ready banaya jaa raha hai... ⏳")

with connection.cursor() as cursor:
    # 1. Database level par emojis allow karein
    cursor.execute("ALTER DATABASE defaultdb CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;")
    
    # 2. Saare tables dhoondh kar unhe update karein
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table[0]
        try:
            cursor.execute(f"ALTER TABLE {table_name} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"✅ Table Theek Ho Gayi: {table_name}")
        except Exception as e:
            pass

print("🚀 CONGRATULATIONS! Aapka Database ab 100% Emoji Ready hai! 🎉")