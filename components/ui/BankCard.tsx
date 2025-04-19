'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { formatAmount } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import { Button } from '../ui/Button';
import Image from 'next/image';
import { Account } from '@/types';

interface BankCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
  showActions?: boolean;
}

const BankCard = ({ account, userName, showBalance = true, showActions = true }: BankCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 銀行口座アイコンの取得
  const getIconForAccountType = (type: string, subtype?: string) => {
    if (type === 'depository') return '/icons/bank.svg';
    if (type === 'credit') return '/icons/credit-card.svg';
    if (type === 'paypay') return '/icons/paypay.svg';
    if (type === 'paidy') return '/icons/paidy.svg';
    return '/icons/wallet.svg';
  };

  // 口座削除処理
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // 削除前の確認
      const confirmDelete = window.confirm('本当にこの口座を削除しますか？\nこの操作は元に戻せません。');
      if (!confirmDelete) {
        setIsDeleting(false);
        return;
      }
      
      // Supabase APIエンドポイントを使用
      const response = await fetch(`/api/bank/delete?id=${account.appwriteItemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        throw new Error(data.error || '口座の削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error instanceof Error ? error.message : '口座の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // 口座編集ページへ遷移
  const handleEdit = () => {
    setIsLoading(true);
    router.push(`/my-account/edit/${account.appwriteItemId}`);
  };

  // 口座詳細ページへ遷移
  const handleView = () => {
    setIsLoading(true);
    router.push(`/my-account/${account.appwriteItemId}`);
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 flex flex-col shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Image 
              src={account.icon || getIconForAccountType(account.type, account.subtype)}
              alt={account.type}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-xs text-gray-500">{account.mask ? `****${account.mask}` : account.officialName}</p>
          </div>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <MoreHorizontal size={18} className="text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                <ExternalLink size={16} className="mr-2" />
                <span>詳細を見る</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit size={16} className="mr-2" />
                <span>編集</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="cursor-pointer text-red-600 focus:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 size={16} className="mr-2" />
                <span>{isDeleting ? '削除中...' : '削除'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {showBalance && (
        <div className="mt-2">
          <p className="text-sm text-gray-500">残高</p>
          <p className="text-lg font-bold">
            ¥{account.currentBalance.toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <span className="text-xs text-gray-500">{userName || 'ユーザー'}</span>
        <Button
          onClick={handleView}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:bg-blue-50 text-xs p-1"
          disabled={isLoading}
        >
          詳細
        </Button>
      </div>
    </div>
  );
};

export default BankCard;