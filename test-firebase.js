// Test Firebase Connection (Both Firestore and Realtime Database)
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Testing Firebase Realtime Database Connection...\n');
console.log('Config:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
});

async function testRealtimeDB() {
  try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    console.log('\n✓ Firebase initialized successfully!');
    console.log('✓ Realtime Database instance created');

    // Create a test guardian alert
    console.log('\n📝 Creating test guardian alert...');

    const testAlert = {
      id: 'test_alert_001',
      userId: 'user_123',
      userName: 'Maria Garcia',
      userPhone: '+1234567890',
      userPhotoUrl: 'https://example.com/photo.jpg',
      dateName: 'Carlos Rodriguez',
      datePhone: '+0987654321',
      dateLocation: 'Restaurant La Mesa, 456 Oak Ave',
      status: 'active',
      activatedAt: new Date().toISOString(),
      lastCheckIn: new Date().toISOString(),
      currentLocation: {
        latitude: 25.7617,
        longitude: -80.1918,
        timestamp: new Date().toISOString()
      }
    };

    const alertRef = ref(database, 'guardian_alerts/test_alert_001');
    await set(alertRef, testAlert);
    console.log('✓ Test alert created successfully!');

    // Read the alert back
    const snapshot = await get(ref(database, 'guardian_alerts'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`\n✓ guardian_alerts contains ${Object.keys(data).length} alert(s)`);
      console.log('\n📊 Data preview:');
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n✅ Firebase Realtime Database connection successful!');
    console.log('✅ Ready for Guardian Alert tracking!');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('  Code:', error.code);
    process.exit(1);
  }
}

testRealtimeDB();
