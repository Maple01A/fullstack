import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // 全クッキーの確認
    const allCookies = cookieStore.getAll();
    console.log("利用可能なクッキー:", allCookies.map(c => c.name));
    
    // Supabaseクライアント生成
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // セッション確認
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        error: error.message,
        cookies: allCookies.map(c => c.name)
      }, { status: 500 });
    }
    
    if (!data.session) {
      return NextResponse.json({ 
        status: 'no-session',
        cookies: allCookies.map(c => c.name)
      });
    }
    
    return NextResponse.json({
      status: 'authenticated',
      userId: data.session.user.id,
      email: data.session.user.email,
      cookies: allCookies.map(c => c.name)
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}