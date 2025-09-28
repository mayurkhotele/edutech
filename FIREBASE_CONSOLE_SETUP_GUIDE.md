# Firebase Console Setup for Expo Go 🔧

## 🚨 Current Issue: `auth/argument-error`

### **Problem:**
- Firebase is trying to use reCAPTCHA
- Expo Go doesn't support reCAPTCHA properly
- Need Firebase Console configuration

### **Solution: Firebase Console Setup**

## 🔧 Step-by-Step Firebase Console Setup:

### **Step 1: Enable Phone Authentication**

1. **Go to Firebase Console:**
   - [Firebase Console](https://console.firebase.google.com/)
   - Select project: **yottascore-6a99f**

2. **Enable Phone Authentication:**
   - Click **Authentication** in left menu
   - Click **Get started** (if first time)
   - Go to **Sign-in method** tab
   - Find **Phone** provider
   - Click **Enable**

3. **Configure Phone Provider:**
   - **Phone** should be **Enabled**
   - **Country/Region** should include **India**

### **Step 2: Configure reCAPTCHA for Expo Go**

1. **In Phone Provider Settings:**
   - **reCAPTCHA settings** section
   - **Enable reCAPTCHA Enterprise** - **DISABLE this**
   - **Use reCAPTCHA v2** - **Enable this**
   - **Add authorized domains:**
     - `localhost`
     - `127.0.0.1`
     - `expo.dev` (for Expo Go)

2. **Important for Expo Go:**
   - **DO NOT** enable reCAPTCHA Enterprise
   - **DO** enable reCAPTCHA v2
   - **Add Expo domains** to authorized domains

### **Step 3: Add Test Phone Numbers (Recommended)**

1. **In Phone Provider Settings:**
   - **Test phone numbers** section
   - **Add test number:**
     - **Phone**: `+91 9876543210`
     - **Test OTP**: `123456`

2. **Benefits:**
   - No SMS charges for testing
   - Fixed OTP for development
   - Works immediately

### **Step 4: Configure App Settings**

1. **Go to Project Settings:**
   - Click gear icon (⚙️) > **Project settings**
   - **General** tab

2. **Add Authorized Domains:**
   - **Authorized domains** section
   - Add these domains:
     - `localhost`
     - `127.0.0.1`
     - `expo.dev`
     - `your-domain.com` (if any)

## 📱 Testing Steps:

### **With Test Phone Number:**
1. **Enter test number**: `9876543210`
2. **Click "Send OTP"**
3. **Enter OTP**: `123456`
4. **Authentication successful**

### **With Real Phone Number:**
1. **Enter real number**: `+91 9876543210`
2. **Click "Send OTP"**
3. **Wait for SMS** (1-2 minutes)
4. **Enter OTP from SMS**
5. **Authentication successful**

## 🔍 Expected Console Logs:

### **Success Logs:**
```
🔥 Firebase JS SDK - Sending OTP to: +91XXXXXXXXXX
✅ OTP sent successfully via Firebase JS SDK
🔥 Firebase JS SDK - Verifying OTP: XXXXXX
✅ OTP verified successfully via Firebase JS SDK
```

### **Error Logs (Before Setup):**
```
❌ Firebase JS SDK Error: auth/argument-error
Failed to initialize reCAPTCHA Enterprise config
```

## 🚨 Important Notes:

1. **reCAPTCHA Enterprise** - Must be **DISABLED** for Expo Go
2. **reCAPTCHA v2** - Should be **ENABLED** for Expo Go
3. **Authorized Domains** - Must include Expo domains
4. **Test Numbers** - Recommended for development

## 🎯 Quick Fix Checklist:

- [ ] **Phone Authentication** enabled
- [ ] **reCAPTCHA Enterprise** disabled
- [ ] **reCAPTCHA v2** enabled
- [ ] **Authorized domains** include `expo.dev`
- [ ] **Test phone numbers** added (optional)
- [ ] **India** in supported countries

## 💡 Why This Works:

1. **Expo Go Compatibility** - reCAPTCHA v2 works with Expo Go
2. **No Enterprise reCAPTCHA** - Avoids compatibility issues
3. **Proper Domains** - Authorizes Expo Go requests
4. **Test Numbers** - Bypass SMS for development

## 🚀 After Setup:

**The `auth/argument-error` should be resolved and OTP will work properly!**

### **Expected Behavior:**
- ✅ No more `auth/argument-error`
- ✅ OTP sending works
- ✅ SMS delivery (for real numbers)
- ✅ Test OTP works (for test numbers)

**Complete the Firebase Console setup to fix the error!**




