// app/api/auth/check/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        error: error.message 
      }, { status: 500 });
    }
    
    if (!data.session) {
      return NextResponse.json({ 
        status: 'no-session',
        auth_cookie: !!cookieStore.get('sb-nspscdabdslwsgystqss-auth-token')
      });
    }
    
    return NextResponse.json({
      status: 'authenticated',
      userId: data.session.user.id,
      email: data.session.user.email,
      auth_cookie: !!cookieStore.get('sb-nspscdabdslwsgystqss-auth-token')
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}