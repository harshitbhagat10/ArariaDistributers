// ==================== FIREBASE CONFIGURATION ====================
// 
// HOW TO SET UP (one-time, takes 5 minutes):
//
// 1. Go to https://console.firebase.google.com/
// 2. Click "Create a project" → Name it "ArariaDistributers" → Continue
// 3. Disable Google Analytics (not needed) → Create Project
// 4. In the project dashboard, click the web icon </> to add a web app
// 5. Name it "ElectroShop" → Register app
// 6. Copy the firebaseConfig object and paste it below (replace the placeholder)
// 7. Go to "Build" → "Realtime Database" → "Create Database"
// 8. Choose a location (asia-southeast1 is closest to India)
// 9. Start in TEST MODE for now (we'll secure it later)
// 10. Done! Your app now syncs across all devices.
//
// SECURITY RULES (paste these in Realtime Database → Rules tab):
// {
//   "rules": {
//     "users": { ".read": true, ".write": true },
//     "products": { ".read": true, ".write": true },
//     "sales": { ".read": true, ".write": true },
//     "adjLog": { ".read": true, ".write": true },
//     "counters": { ".read": true, ".write": true }
//   }
// }
//

const firebaseConfig = {
    apiKey: "AIzaSyD4dSP2FVWMTLOaQxsC-x-RqkdBG_hXvw4",
    authDomain: "arariadistributers.firebaseapp.com",
    databaseURL: "https://arariadistributers-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "arariadistributers",
    storageBucket: "arariadistributers.firebasestorage.app",
    messagingSenderId: "1056258411463",
    appId: "1:1056258411463:web:4e35309b67893f2f9627e2",
    measurementId: "G-CSL99F0HBV"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Database references
const dbRef = {
  users: db.ref('users'),
  products: db.ref('products'),
  sales: db.ref('sales'),
  adjLog: db.ref('adjLog'),
  counters: db.ref('counters'),
  attendance: db.ref('attendance')
};

// Connection status tracking
let isOnline = false;

db.ref('.info/connected').on('value', (snap) => {
  isOnline = snap.val() === true;
  updateConnectionStatus();
});

function updateConnectionStatus() {
  const el = document.getElementById('connection-status');
  if (!el) return;
  if (isOnline) {
    el.innerHTML = '<span class="status-dot dot-g"></span> Online — Synced';
    el.style.color = '#16a34a';
  } else {
    el.innerHTML = '<span class="status-dot dot-r"></span> Offline — Local only';
    el.style.color = '#dc2626';
  }
}
