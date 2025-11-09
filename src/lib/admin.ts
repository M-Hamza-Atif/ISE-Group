import { supabase } from "@/integrations/supabase/client";

// Admin credentials (hardcoded as per requirement)
const ADMIN_USERNAME = "mewmewNIGGER";
const ADMIN_PASSWORD = "MEWMEWnigger";
const ADMIN_SESSION_KEY = "campus_admin_session";

export const adminSignIn = async (username: string, password: string) => {
  // Validate credentials
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error("Invalid admin credentials");
  }

  // Store admin session in localStorage
  localStorage.setItem(ADMIN_SESSION_KEY, "true");
  
  // Create a special admin session
  // First, try to sign in with a pre-created admin email
  const adminEmail = "admin@campusmarketplace.internal";
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: ADMIN_PASSWORD,
    });
    
    if (error) {
      // If admin doesn't exist, create it
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: ADMIN_PASSWORD,
        options: {
          data: {
            full_name: "System Administrator",
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      // Create admin profile
      if (signUpData.user) {
        await supabase.from('profiles').insert([
          {
            id: signUpData.user.id,
            full_name: "System Administrator",
            is_admin: true,
          },
        ]);
      }
      
      // Sign in again
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: ADMIN_PASSWORD,
      });
      
      if (retryError) throw retryError;
      return retryData;
    }
    
    return data;
  } catch (error) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    throw error;
  }
};

export const isAdminSession = (): boolean => {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error || !data) return false;
  return data.is_admin === true;
};

export const getAdminStats = async () => {
  const { data, error } = await supabase.rpc('get_admin_stats');
  if (error) throw error;
  return data;
};
