# Firestore Setup Guide

## Quick Setup

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **braless-3c6e9**
3. Click **"Firestore Database"** in the left sidebar
4. If you see "Create database", click it
5. Choose **"Start in test mode"** (we'll update rules next)
6. Select a location (choose closest to you)
7. Click **"Enable"**

### 2. Set Up Security Rules

**Option A: Quick Test Mode (Easiest - for development only)**

1. In Firestore Database, click the **"Rules"** tab
2. If you see test mode rules, you're good! They look like this:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```
3. If not, replace with this (temporary test mode):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
4. Click **"Publish"**

**Option B: Production Rules (Secure - Use This for Production)**

1. In Firestore Database, click the **"Rules"** tab
2. Replace the default rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Songs collection
    match /songs/{songId} {
      // Users can read their own songs
      allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
      
      // Users can create songs - must set their own userId
      allow create: if isAuthenticated() 
        && request.auth.uid == request.resource.data.userId
        && request.resource.data.keys().hasAll(['userId', 'createdAt', 'updatedAt', 'metadata']);
      
      // Users can update their own songs - cannot change userId
      allow update: if isAuthenticated() 
        && request.auth.uid == resource.data.userId
        && request.auth.uid == request.resource.data.userId
        && resource.data.userId == request.resource.data.userId;
      
      // Users can delete their own songs
      allow delete: if isAuthenticated() && request.auth.uid == resource.data.userId;
    }
    
    // Song versions collection
    match /songVersions/{versionId} {
      // Users can read versions of their own songs
      allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
      
      // Users can create versions - must set their own userId
      allow create: if isAuthenticated() 
        && request.auth.uid == request.resource.data.userId
        && request.resource.data.keys().hasAll(['songId', 'versionNumber', 'code', 'userId', 'createdAt', 'executedAt']);
      
      // Users can update their own versions - cannot change userId
      allow update: if isAuthenticated() 
        && request.auth.uid == resource.data.userId
        && request.auth.uid == request.resource.data.userId
        && resource.data.userId == request.resource.data.userId;
      
      // Users can delete their own versions
      allow delete: if isAuthenticated() && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Key Security Features:**
- ✅ Users can only access their own data (userId must match auth.uid)
- ✅ Prevents userId spoofing (validates userId on create/update)
- ✅ Validates required fields on create
- ✅ Prevents changing userId on update
- ✅ All operations require authentication

3. Click **"Publish"**

### 3. That's It!

Now when you:
- Sign in with Google
- Click "Run Code"
- Versions will save to Firestore!

## Troubleshooting

### "Missing or insufficient permissions" Error

- Make sure you're signed in (check the top right)
- Verify the security rules are published (Rules tab → Publish button)
- Check that the rules match exactly what's above
- Make sure Firestore is enabled (not just created)

### Test Mode Rules (Temporary)

If you want to test quickly, you can temporarily use these rules (NOT for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write anything. Use only for testing!

