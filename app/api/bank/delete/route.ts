import { NextRequest, NextResponse } from 'next/server';
import { deleteAccount } from '@/lib/actions/bank.actions';
import { getServerUser } from '@/lib/actions/user.server.actions';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }
    
    // 認証確認
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // 口座削除
    const result = await deleteAccount(id, user.id);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API削除エラー:', error);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}