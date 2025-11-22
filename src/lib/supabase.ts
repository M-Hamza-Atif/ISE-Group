import { supabase } from "@/integrations/supabase/client";

export const signUp = async (email: string, password: string, fullName: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  
  // Check if user already exists (Supabase returns a user object but with identities empty array)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('An account with this email already exists');
  }
  
  // Profile will be automatically created by database trigger
  // No need to manually insert into profiles table
  
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
