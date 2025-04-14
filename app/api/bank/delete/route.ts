import { deleteAccount } from '@/lib/actions/bank.actions';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }

    const success = await deleteAccount(id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '口座が見つかりません' }, { status: 404 });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: '削除中にエラーが発生しました' }, { status: 500 });
  }
} 