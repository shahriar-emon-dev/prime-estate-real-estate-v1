import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AppRole, getUserRoleById } from '@/lib/supabaseServer';

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createRouteSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from a Server Component context where cookies
          // are read-only. The cookie refresh will be handled by middleware instead.
        }
      },
    },
  });
}

export async function requireAuthenticatedUser() {
  const supabase = await createRouteSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, supabase, response: null };
}

export async function requireAdminUser() {
  const authResult = await requireAuthenticatedUser();

  if (authResult.response || !authResult.user) {
    return {
      user: null,
      role: 'user' as AppRole,
      supabase: authResult.supabase,
      response: authResult.response,
    };
  }

  const role = await getUserRoleById(authResult.user.id, authResult.supabase);
  if (role !== 'admin') {
    return {
      user: authResult.user,
      role,
      supabase: authResult.supabase,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    user: authResult.user,
    role,
    supabase: authResult.supabase,
    response: null,
  };
}
