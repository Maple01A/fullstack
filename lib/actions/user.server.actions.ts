// lib/actions/user.server.actions.ts
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * サーバーサイドでログインユーザー情報を取得
 * @returns ユーザー情報またはnull
 */
export async function getServerUser() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.user_metadata?.firstName || '',
      lastName: session.user.user_metadata?.lastName || '',
    };
  } catch {
    return null;
  }
}