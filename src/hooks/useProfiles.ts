import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock data store for frontend-only mode
const STORAGE_KEY = 'profiles_data';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  status: string | null;
  join_date: string | null;
  performance_score: number | null;
  avatar_url: string | null;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Load from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const data = storedData ? JSON.parse(storedData) : [];
      setProfiles(data);
    } catch (error: any) {
      toast.error('Failed to load profiles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    try {
      // Update in localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const data = storedData ? JSON.parse(storedData) : [];
      const updatedData = data.map((profile: Profile) => 
        profile.id === id ? { ...profile, ...updates } : profile
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      toast.success('Profile updated successfully');
      fetchProfiles();
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  return {
    profiles,
    loading,
    updateProfile,
    refetch: fetchProfiles,
  };
};