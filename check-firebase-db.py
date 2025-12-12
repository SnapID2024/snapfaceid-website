import firebase_admin
from firebase_admin import credentials, db
import sys

# Initialize Firebase Admin SDK
cred = credentials.Certificate('/Users/bet_advisor/Desktop/mi_app_backend/serviceAccountKey.json')

try:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://snapid-9e5f4-default-rtdb.firebaseio.com'
    })
    
    # Try to read from the database
    ref = db.reference('/')
    data = ref.get()
    
    print("✓ Firebase Admin SDK connected successfully!")
    print(f"✓ Database URL: https://snapid-9e5f4-default-rtdb.firebaseio.com")
    
    if data:
        print(f"\n📊 Database contains {len(data)} root key(s):")
        for key in data.keys():
            print(f"  - {key}")
    else:
        print("\n⚠ Database is empty (no data at root level)")
        print("  This is normal for a new database")
    
except Exception as e:
    print(f"✗ Error connecting to Firebase: {e}")
    sys.exit(1)
