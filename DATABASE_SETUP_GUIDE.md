# Database Setup Guide for MyEduPro

## 🚀 Quick Setup Instructions

### Step 1: Apply the Database Migration

1. **Go to your Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** (ID: `sbaikpqcgpbxetkpmbez`)
3. **Navigate to SQL Editor** (left sidebar)
4. **Copy and paste** the entire content from `supabase/migrations/complete_database_setup.sql`
5. **Click "Run"** to execute the migration

### Step 2: Verify Setup

After running the migration, verify these tables exist in **Table Editor**:
- ✅ `user_profiles`
- ✅ `user_progress_stats` 
- ✅ `subject_progress`
- ✅ `study_sessions`
- ✅ `user_databases`

### Step 3: Test User Registration

1. **Restart your development server**: `npm run dev`
2. **Try creating a new account** at `/signup`
3. **Check if the signup completes successfully**

---

## 🔧 What This Migration Does

### Database Tables Created:

1. **`user_profiles`** - Stores user profile information
   - Personal details (name, grade, board, area)
   - Profile picture URL
   - Subject group and subjects array

2. **`user_progress_stats`** - Overall progress tracking
   - Study streaks, total time, completed lessons
   - Test scores and AI session counts
   - Weekly/monthly statistics

3. **`subject_progress`** - Individual subject progress
   - Progress percentage per subject
   - Completed vs total topics
   - Last accessed timestamps

4. **`study_sessions`** - Activity logging
   - Session type (lesson, test, AI tutor, materials)
   - Duration, scores, and dates

5. **`user_databases`** - User-specific configurations
   - Grade-based subject assignments
   - Board-specific content mapping

### Security Features:

- **Row Level Security (RLS)** enabled on all tables
- **Comprehensive policies** ensuring users can only access their own data
- **Secure functions** with proper error handling
- **Storage policies** for profile picture uploads

### Automation Features:

- **Auto-profile creation** when users sign up
- **Progress initialization** for new users
- **Database setup** when profiles are updated
- **Timestamp updates** on record changes

---

## 🛠️ Troubleshooting

### If Migration Fails:

1. **Check project status** - Ensure your Supabase project is active (not paused)
2. **Clear existing data** - The migration drops existing tables for clean setup
3. **Run in parts** - If the full migration fails, run sections individually
4. **Check permissions** - Ensure you have admin access to the project

### Common Issues:

**"Policy already exists" errors:**
- ✅ **Fixed** - Migration now drops existing policies before creating new ones

**"Function already exists" errors:**
- ✅ **Fixed** - Migration uses `CREATE OR REPLACE FUNCTION`

**"Table already exists" errors:**
- ✅ **Fixed** - Migration drops tables before recreating them

**"Database error saving new user":**
- ✅ **Fixed** - Added robust error handling in trigger functions

### Verification Commands:

Run these in SQL Editor to verify setup:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_progress_stats', 'subject_progress', 'study_sessions', 'user_databases');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_progress_stats', 'subject_progress', 'study_sessions', 'user_databases');

-- Check if triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## 📊 Database Schema Overview

```
auth.users (Supabase Auth)
    ↓ (triggers)
user_profiles (Profile Info)
    ↓ (triggers)
user_progress_stats (Overall Stats)
user_databases (Configuration)
subject_progress (Subject Details)
study_sessions (Activity Log)
```

### Key Relationships:

- All tables reference `auth.users(id)` with CASCADE DELETE
- `user_progress_stats` has UNIQUE constraint on `user_id`
- `subject_progress` has UNIQUE constraint on `(user_id, subject_name)`
- `user_databases` has UNIQUE constraint on `user_id`

---

## 🎯 Next Steps After Setup

1. **Test user registration** - Create a new account
2. **Verify profile creation** - Check if profile data is saved
3. **Test progress tracking** - Use dashboard features
4. **Check analytics** - Verify progress statistics work
5. **Test subject selection** - Complete profile setup flow

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase Status**: [https://status.supabase.com](https://status.supabase.com)
2. **Verify Project Active**: Ensure project isn't paused
3. **Review Error Logs**: Check browser console for specific errors
4. **Contact Support**: Use Supabase support if on paid plan

The migration includes comprehensive error handling, so most issues should be automatically resolved or logged as warnings without breaking the user experience.