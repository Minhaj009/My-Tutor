# Supabase Connection Troubleshooting Guide

## 🚨 URGENT: "Database error saving new user" Fix

If you're seeing the error **"Database error saving new user"** during signup, this means your Supabase project is likely **paused** or experiencing backend issues.

### Immediate Fix Steps:

1. **Go to your Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Find your project** in the project list
3. **Check if it shows "PAUSED"** - if so, click **"Resume"**
4. **Wait 2-3 minutes** for the project to fully restart
5. **Restart your development server**: `npm run dev`
6. **Try signing up again**

### Why This Happens:
- Supabase free tier projects automatically pause after 1 week of inactivity
- The authentication service can't save user data when the database is paused
- This affects the entire signup process, not just your app code

---

## Common Issues and Solutions

### 1. "Failed to fetch" Errors

This error typically indicates that your Supabase project is not accessible. Here are the most common causes and solutions:

#### **Project is Paused or Inactive**
- **Cause**: Supabase projects on the free tier are automatically paused after 1 week of inactivity
- **Solution**: 
  1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
  2. Find your project and click "Resume" if it shows as paused
  3. Wait for the project to fully restart (this can take a few minutes)
  4. Restart your development server

#### **Incorrect Project URL**
- **Cause**: The `VITE_SUPABASE_URL` in your `.env` file is incorrect
- **Solution**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings > API
  3. Copy the "Project URL" 
  4. Update your `.env` file with the correct URL
  5. Restart your development server

#### **Invalid API Key**
- **Cause**: The `VITE_SUPABASE_ANON_KEY` in your `.env` file is incorrect or expired
- **Solution**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings > API
  3. Copy the "anon public" key
  4. Update your `.env` file with the correct key
  5. Restart your development server

### 2. Network/Connectivity Issues

#### **Firewall or Network Restrictions**
- **Cause**: Your network may be blocking connections to Supabase
- **Solution**:
  1. Try accessing your Supabase dashboard directly in a browser
  2. If that works, the issue may be with your development environment
  3. Try restarting your development server
  4. Check if you're behind a corporate firewall that blocks external API calls

#### **DNS Issues**
- **Cause**: DNS resolution problems preventing connection to Supabase
- **Solution**:
  1. Try accessing `https://your-project-id.supabase.co` directly in a browser
  2. If it doesn't load, there may be a DNS issue
  3. Try using a different DNS server (like 8.8.8.8)

### 3. Project Configuration Issues

#### **Missing Database Tables**
- **Cause**: The required database tables haven't been created yet
- **Solution**:
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Run the migration files from `supabase/migrations/` folder
  4. Or follow the setup instructions in `SETUP_INSTRUCTIONS.md`

#### **Row Level Security (RLS) Issues**
- **Cause**: RLS policies are preventing access to data
- **Solution**:
  1. Check that RLS policies are properly configured
  2. Verify that the policies match your authentication setup
  3. Review the migration files to ensure policies are correctly applied

### 4. Development Environment Issues

#### **Environment Variables Not Loading**
- **Cause**: The `.env` file is not being read properly
- **Solution**:
  1. Ensure the `.env` file is in your project root directory
  2. Restart your development server completely
  3. Check that variable names start with `VITE_` for Vite projects
  4. Verify there are no extra spaces or quotes around the values

#### **Caching Issues**
- **Cause**: Browser or development server caching old configuration
- **Solution**:
  1. Clear your browser cache and local storage
  2. Restart your development server
  3. Try opening the app in an incognito/private browser window

### 5. Quick Diagnostic Steps

Run through these steps to quickly identify the issue:

1. **Check Project Status**:
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Verify your project is active and not paused

2. **Verify Credentials**:
   - Go to Settings > API in your Supabase dashboard
   - Compare the URL and anon key with your `.env` file

3. **Test Direct Access**:
   - Try accessing `https://your-project-id.supabase.co` in a browser
   - You should see a JSON response, not an error page

4. **Check Console Logs**:
   - Open browser developer tools
   - Look for specific error messages in the console
   - Check the Network tab for failed requests

5. **Restart Everything**:
   - Stop your development server
   - Clear browser cache
   - Restart the development server
   - Try again

### 6. Authentication-Specific Issues

#### **"Database error saving new user"**
- **Cause**: Supabase project is paused or database backend is unavailable
- **Solution**: Resume your Supabase project and wait for full restart

#### **"unexpected_failure" during signup**
- **Cause**: Backend database connectivity issues
- **Solution**: Check project status and restart if needed

#### **Rate Limiting Errors**
- **Cause**: Too many signup/signin attempts
- **Solution**: Wait 5-10 minutes before trying again

### 7. Getting Help

If none of these solutions work:

1. **Check Supabase Status**: Visit [https://status.supabase.com](https://status.supabase.com) to see if there are any ongoing issues

2. **Review Error Messages**: Look for specific error codes or messages in your browser console

3. **Contact Support**: If you're on a paid plan, you can contact Supabase support directly

4. **Community Help**: Ask for help in the Supabase Discord or GitHub discussions

### 8. Prevention Tips

To avoid these issues in the future:

1. **Regular Activity**: Access your Supabase project regularly to prevent auto-pausing
2. **Backup Credentials**: Keep a secure backup of your project credentials
3. **Monitor Status**: Subscribe to Supabase status updates
4. **Version Control**: Don't commit your actual `.env` file to version control
5. **Documentation**: Keep your setup documentation up to date

## Current Project Status

Based on your current configuration:
- **Project URL**: `https://jpqzmemejspasafbhnzj.supabase.co`
- **Status**: The credentials appear to be valid, but the project may be paused or experiencing connectivity issues

**Recommended Action**: Check if your Supabase project is active and restart it if necessary.

## Error Code Reference

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Database error saving new user" | Project paused | Resume project in dashboard |
| "unexpected_failure" | Backend database issue | Check project status |
| "Failed to fetch" | Network/connection issue | Check credentials and connectivity |
| "Auth session missing" | Session expired | Sign in again |
| "Invalid login credentials" | Wrong email/password | Check credentials |
| "Too many requests" | Rate limiting | Wait before retrying |