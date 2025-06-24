import { supabase } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'

export interface SubjectGroup {
  id: string
  name: string
  description: string
  subjects: string[]
}

export class SubjectGroupService {
  // Get available subject groups based on grade
  static getSubjectGroups(grade: string): SubjectGroup[] {
    // Class 9 and 10 Metric (all boards have same structure)
    if (grade === "Class 9 (Metric)" || grade === "Class 10 (Metric)") {
      return [
        {
          id: 'science-biology',
          name: 'Science (Biology)',
          description: 'Focus on biological sciences with core subjects',
          subjects: [
            'English',
            'Urdu', 
            'Islamiat (Compulsory)',
            'Pakistan Studies',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology'
          ]
        },
        {
          id: 'science-computer',
          name: 'Science (Computer)',
          description: 'Focus on computer science with core subjects',
          subjects: [
            'English',
            'Urdu',
            'Islamiat (Compulsory)', 
            'Pakistan Studies',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Computer Science'
          ]
        }
      ];
    }

    // Class 11 FSc (all boards have same structure)
    if (grade === "Class 11 (FSc)") {
      return [
        {
          id: 'fsc-pre-medical',
          name: 'FSc (Pre-Medical)',
          description: 'Preparation for medical entrance exams',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Islamiyat (Compulsory)',
            'Physics',
            'Chemistry',
            'Biology'
          ]
        },
        {
          id: 'fsc-pre-engineering',
          name: 'FSc (Pre-Engineering)',
          description: 'Preparation for engineering entrance exams',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Islamiyat (Compulsory)',
            'Physics',
            'Chemistry',
            'Mathematics'
          ]
        },
        {
          id: 'fsc-ics',
          name: 'FSc (ICS)',
          description: 'Information and Computer Sciences',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Islamiyat (Compulsory)',
            'Physics',
            'Computer Science',
            'Mathematics'
          ]
        }
      ];
    }

    // Class 12 FSc (Pakistan Studies instead of Islamiyat)
    if (grade === "Class 12 (FSc)") {
      return [
        {
          id: 'fsc-pre-medical',
          name: 'FSc (Pre-Medical)',
          description: 'Preparation for medical entrance exams',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Pakistan Studies (Compulsory)',
            'Physics',
            'Chemistry',
            'Biology'
          ]
        },
        {
          id: 'fsc-pre-engineering',
          name: 'FSc (Pre-Engineering)',
          description: 'Preparation for engineering entrance exams',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Pakistan Studies (Compulsory)',
            'Physics',
            'Chemistry',
            'Mathematics'
          ]
        },
        {
          id: 'fsc-ics',
          name: 'FSc (ICS)',
          description: 'Information and Computer Sciences',
          subjects: [
            'English (Compulsory)',
            'Urdu (Compulsory)',
            'Pakistan Studies (Compulsory)',
            'Physics',
            'Computer Science',
            'Mathematics'
          ]
        }
      ];
    }

    // O-levels and A-levels don't have predefined groups
    if (grade === "O-levels" || grade === "A-Levels") {
      return [
        {
          id: 'cambridge-standard',
          name: 'Cambridge Standard',
          description: 'Standard Cambridge curriculum subjects',
          subjects: grade === "O-levels" ? [
            'English Language',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Pakistan Studies',
            'Islamiyat',
            'Computer Science'
          ] : [
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Economics',
            'Computer Science',
            'Psychology'
          ]
        }
      ];
    }

    // MDCAT and ECAT have fixed subjects
    if (grade === "MDCAT") {
      return [
        {
          id: 'mdcat-standard',
          name: 'MDCAT Preparation',
          description: 'Medical and Dental College Admission Test preparation',
          subjects: [
            'Biology',
            'Chemistry',
            'Physics',
            'English',
            'Logical Reasoning'
          ]
        }
      ];
    }

    if (grade === "ECAT") {
      return [
        {
          id: 'ecat-standard',
          name: 'ECAT Preparation',
          description: 'Engineering College Admission Test preparation',
          subjects: [
            'Mathematics',
            'Physics',
            'Chemistry',
            'English'
          ]
        }
      ];
    }

    return [];
  }

  // Check if a grade requires subject group selection
  static requiresSubjectGroupSelection(grade: string): boolean {
    return [
      "Class 9 (Metric)",
      "Class 10 (Metric)", 
      "Class 11 (FSc)",
      "Class 12 (FSc)",
      "O-levels",
      "A-Levels",
      "MDCAT",
      "ECAT"
    ].includes(grade);
  }

  // Save user's subject group selection
  static async saveSubjectGroupSelection(
    userId: string, 
    groupId: string, 
    profile: UserProfile
  ): Promise<void> {
    try {
      const groups = this.getSubjectGroups(profile.grade);
      const selectedGroup = groups.find(g => g.id === groupId);
      
      if (!selectedGroup) {
        throw new Error('Invalid subject group selection');
      }

      // Create or update user database record
      const { error } = await supabase
        .from('user_databases')
        .upsert({
          user_id: userId,
          database_name: `user_${userId.replace(/-/g, '_')}_db`,
          grade: profile.grade,
          board: profile.board || null,
          subjects: selectedGroup.subjects,
          subject_group: groupId
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving subject group:', error);
        throw new Error('Failed to save subject group selection');
      }

      // Initialize subject progress for selected subjects
      await this.initializeSubjectProgress(userId, selectedGroup.subjects, profile.grade);

    } catch (error) {
      console.error('Subject group selection error:', error);
      throw error;
    }
  }

  // Initialize subject progress for selected subjects
  private static async initializeSubjectProgress(
    userId: string,
    subjects: string[],
    grade: string
  ): Promise<void> {
    try {
      const subjectProgressData = subjects.map(subject => ({
        user_id: userId,
        subject_name: subject,
        progress_percentage: 0,
        completed_topics: 0,
        total_topics: this.getTotalTopicsForSubject(subject, grade),
        last_accessed: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('subject_progress')
        .upsert(subjectProgressData, { onConflict: 'user_id,subject_name' });

      if (error) {
        console.error('Error initializing subject progress:', error);
      }
    } catch (error) {
      console.error('Error in initializeSubjectProgress:', error);
    }
  }

  // Get total topics for a subject based on grade
  private static getTotalTopicsForSubject(subject: string, grade: string): number {
    const topicCounts: { [key: string]: { [key: string]: number } } = {
      'Mathematics': {
        'Class 9 (Metric)': 15,
        'Class 10 (Metric)': 18,
        'Class 11 (FSc)': 20,
        'Class 12 (FSc)': 22,
        'O-levels': 16,
        'A-Levels': 25,
        'ECAT': 30
      },
      'Physics': {
        'Class 9 (Metric)': 12,
        'Class 10 (Metric)': 15,
        'Class 11 (FSc)': 18,
        'Class 12 (FSc)': 20,
        'O-levels': 14,
        'A-Levels': 22,
        'MDCAT': 25,
        'ECAT': 28
      },
      'Chemistry': {
        'Class 9 (Metric)': 10,
        'Class 10 (Metric)': 12,
        'Class 11 (FSc)': 16,
        'Class 12 (FSc)': 18,
        'O-levels': 12,
        'A-Levels': 20,
        'MDCAT': 22,
        'ECAT': 20
      },
      'Biology': {
        'Class 9 (Metric)': 8,
        'Class 10 (Metric)': 10,
        'Class 11 (FSc)': 14,
        'Class 12 (FSc)': 16,
        'O-levels': 10,
        'A-Levels': 18,
        'MDCAT': 30
      }
    };

    return topicCounts[subject]?.[grade] || 15; // Default to 15 topics
  }

  // Get user's selected subject group
  static async getUserSubjectGroup(userId: string): Promise<{ groupId: string; subjects: string[] } | null> {
    try {
      const { data, error } = await supabase
        .from('user_databases')
        .select('subject_group, subjects')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        groupId: data.subject_group || '',
        subjects: data.subjects || []
      };
    } catch (error) {
      console.error('Error fetching user subject group:', error);
      return null;
    }
  }
}