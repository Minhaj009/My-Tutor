/*
  # Complete Database Schema Setup

  1. New Tables
    - `user_profiles` - User profile information
    - `user_progress_stats` - User learning progress statistics  
    - `subject_progress` - Progress tracking per subject
    - `study_sessions` - Record of study activities
    - `user_databases` - User-specific database configurations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Create triggers for automatic profile creation and progress initialization

  3. Functions
    - `handle_new_user()` - Automatically create user profile on signup
    - `update_updated_at_column()` - Update timestamps on record changes
    - `initialize_user_progress()` - Set up initial progress tracking
    - `create_user_database_on_profile_update()` - Create user database when profile is updated
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS subject_progress CASCADE;
DROP TABLE IF EXISTS user_databases CASCADE;
DROP TABLE IF EXISTS user_progress_stats CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  board text,
  area text,
  profile_picture_url text,
  subject_group text,
  subjects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_progress_stats table
CREATE TABLE user_progress_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_streak_days integer DEFAULT 0,
  total_study_time_minutes integer DEFAULT 0,
  completed_lessons integer DEFAULT 0,
  total_tests_taken integer DEFAULT 0,
  average_test_score numeric(5,2) DEFAULT 0.00,
  ai_sessions_count integer DEFAULT 0,
  weekly_study_time integer DEFAULT 0,
  monthly_study_time integer DEFAULT 0,
  last_study_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subject_progress table
CREATE TABLE subject_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_topics integer DEFAULT 0,
  total_topics integer DEFAULT 20,
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_name)
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('lesson', 'test', 'ai_tutor', 'materials')),
  subject text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  score integer CHECK (score >= 0 AND score <= 100),
  session_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create user_databases table
CREATE TABLE user_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_name text NOT NULL,
  grade text NOT NULL,
  board text,
  subject_group text,
  subjects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_progress_stats_user_id ON user_progress_stats(user_id);
CREATE INDEX idx_subject_progress_user_id ON subject_progress(user_id);
CREATE INDEX idx_subject_progress_subject ON subject_progress(user_id, subject_name);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(user_id, session_date);
CREATE INDEX idx_user_databases_user_id ON user_databases(user_id);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_databases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can insert own progress stats" ON user_progress_stats;
DROP POLICY IF EXISTS "Users can view own progress stats" ON user_progress_stats;
DROP POLICY IF EXISTS "Users can update own progress stats" ON user_progress_stats;

DROP POLICY IF EXISTS "Users can insert own subject progress" ON subject_progress;
DROP POLICY IF EXISTS "Users can view own subject progress" ON subject_progress;
DROP POLICY IF EXISTS "Users can update own subject progress" ON subject_progress;

DROP POLICY IF EXISTS "Users can insert own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can view own study sessions" ON study_sessions;

DROP POLICY IF EXISTS "Users can insert own database" ON user_databases;
DROP POLICY IF EXISTS "Users can view own database" ON user_databases;
DROP POLICY IF EXISTS "Users can update own database" ON user_databases;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_progress_stats
CREATE POLICY "Users can insert own progress stats"
  ON user_progress_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress stats"
  ON user_progress_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress stats"
  ON user_progress_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for subject_progress
CREATE POLICY "Users can insert own subject progress"
  ON subject_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subject progress"
  ON subject_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subject progress"
  ON subject_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for study_sessions
CREATE POLICY "Users can insert own study sessions"
  ON study_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own study sessions"
  ON study_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for user_databases
CREATE POLICY "Users can insert own database"
  ON user_databases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own database"
  ON user_databases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own database"
  ON user_databases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_progress_stats_updated_at ON user_progress_stats;
DROP TRIGGER IF EXISTS update_subject_progress_updated_at ON subject_progress;
DROP TRIGGER IF EXISTS update_user_databases_updated_at ON user_databases;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_progress_trigger ON user_profiles;
DROP TRIGGER IF EXISTS create_user_database_trigger ON user_profiles;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_stats_updated_at
  BEFORE UPDATE ON user_progress_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_progress_updated_at
  BEFORE UPDATE ON subject_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_databases_updated_at
  BEFORE UPDATE ON user_databases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name, grade)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'grade', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create function to initialize user progress
CREATE OR REPLACE FUNCTION initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize user progress stats
  INSERT INTO public.user_progress_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to initialize user progress: %', SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create function to create user database on profile update
CREATE OR REPLACE FUNCTION create_user_database_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create database if grade is set and database doesn't exist
  IF NEW.grade IS NOT NULL AND NEW.grade != '' THEN
    INSERT INTO public.user_databases (
      user_id,
      database_name,
      grade,
      board,
      subject_group,
      subjects
    )
    VALUES (
      NEW.id,
      'user_' || replace(NEW.id::text, '-', '_') || '_db',
      NEW.grade,
      NEW.board,
      NEW.subject_group,
      NEW.subjects
    )
    ON CONFLICT (user_id) DO UPDATE SET
      grade = NEW.grade,
      board = NEW.board,
      subject_group = NEW.subject_group,
      subjects = NEW.subjects,
      updated_at = now();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user database: %', SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger to initialize user progress after profile creation
CREATE TRIGGER initialize_user_progress_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION initialize_user_progress();

-- Create trigger to create user database when profile is updated
CREATE TRIGGER create_user_database_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_database_on_profile_update();