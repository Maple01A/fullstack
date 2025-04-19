import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }
    
    // Supabaseクライアント初期化
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // ユーザー認証確認
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // 口座が現在のユーザーのものか確認
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!account) {
      return NextResponse.json({ error: '口座が見つかりません' }, { status: 404 });
    }
    
    if (account.user_id !== session.user.id) {
      return NextResponse.json({ error: 'この操作は許可されていません' }, { status: 403 });
    }
    
    // 口座を削除
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('削除エラー:', error);
      return NextResponse.json({ error: '口座の削除に失敗しました' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('エラー:', error);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}