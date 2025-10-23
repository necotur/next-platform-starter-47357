
/**
 * Test script to verify Firebase Admin SDK initialization
 * Run with: node -r dotenv/config scripts/test-firebase.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Firebase Admin SDK Configuration...\n');

// Check environment variable
console.log('1️⃣ Checking FIREBASE_ADMIN_KEY_PATH environment variable...');
const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
console.log('   Value:', keyPath || '(not set)');

if (!keyPath) {
  console.error('   ❌ FIREBASE_ADMIN_KEY_PATH is not set in .env file');
  process.exit(1);
}

// Check file path resolution
console.log('\n2️⃣ Resolving file path...');
const fullPath = path.isAbsolute(keyPath) 
  ? keyPath 
  : path.join(process.cwd(), keyPath);
console.log('   Resolved path:', fullPath);
console.log('   Current directory:', process.cwd());

// Check if file exists
console.log('\n3️⃣ Checking if file exists...');
if (!fs.existsSync(fullPath)) {
  console.error('   ❌ File not found at:', fullPath);
  process.exit(1);
}
console.log('   ✅ File exists');

// Check if file is readable
console.log('\n4️⃣ Checking if file is readable...');
try {
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const serviceAccount = JSON.parse(fileContent);
  console.log('   ✅ File is readable and valid JSON');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
} catch (error) {
  console.error('   ❌ Error reading file:', error.message);
  process.exit(1);
}

// Try to initialize Firebase Admin
console.log('\n5️⃣ Initializing Firebase Admin SDK...');
try {
  const admin = require('firebase-admin');
  
  // Clean up any existing apps
  if (admin.apps.length > 0) {
    admin.apps.forEach(app => app.delete());
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  
  console.log('   ✅ Firebase Admin SDK initialized successfully');
  console.log('   App Name:', admin.app().name);
  
  // Test messaging
  console.log('\n6️⃣ Testing Firebase Messaging...');
  const messaging = admin.messaging();
  console.log('   ✅ Firebase Messaging instance obtained');
  
  console.log('\n✅ All tests passed! Firebase Admin SDK is properly configured.\n');
  
} catch (error) {
  console.error('   ❌ Error initializing Firebase Admin:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
