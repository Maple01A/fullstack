'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu';
import { Button } from './Button';
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// 口座タイプに応じたグラデーション背景の取得
const getCardGradient = (type: string): string => {
  switch (type) {
    case 'depository':
      return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
    case 'credit':
      return 'bg-gradient-to-r from-yellow-50 to-orange-100 border-orange-200';
    case 'paypay':
      return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200';
    case 'paidy':
      return 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200';
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
  }
};

// 口座タイプに応じたアイコン色の取得
const getIconBackground = (type: string): string => {
  switch (type) {
    case 'depository':
      return 'bg-blue-100';
    case 'credit':
      return 'bg-orange-100';
    case 'paypay':
      return 'bg-red-100';
    case 'paidy':
      return 'bg-purple-100';
    default:
      return 'bg-gray-100';
  }
};

// 銀行口座アイコンの取得
const getIconForAccountType = (type: string): string => {
  switch (type) {
    case 'depository':
      return '/icons/credit-card.svg';
    case 'credit':
      return '/icons/credit-card.svg';
    case 'paypay':
      return '/icons/paypay.svg';
    case 'paidy':
      return '/icons/paidy.svg';
    default:
      return '/icons/wallet.svg';
  }
};

interface BankCardProps {
  account: {
    appwriteItemId: string;
    name: string;
    type: string;
    currentBalance: number;
    icon?: string | null;
    mask?: string;
  };
  userName: string;
  showBalance?: boolean;
  showActions?: boolean;
}

const BankCard = ({ account, userName, showBalance = true, showActions = true }: BankCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // アイコンのソースを適切に設定（空の文字列を回避）
  const iconSrc = account.icon || getIconForAccountType(account.type);

  return (
    <div className={`relative rounded-xl border p-4 flex flex-col shadow-sm hover:shadow-md transition-all duration-200 ${getCardGradient(account.type)}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconBackground(account.type)}`}>
            {/* 空の文字列を回避し、デフォルトアイコンを使用 */}
            <Image 
              src={iconSrc}
              alt={account.name || account.type}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{account.name}</h3>
            {account.mask && <p className="text-xs text-gray-500">****{account.mask}</p>}
          </div>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <MoreHorizontal size={18} className="text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                <ExternalLink size={16} className="mr-2" />
                <span>詳細を見る</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit size={16} className="mr-2" />
                <span>編集</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="cursor-pointer text-red-600"
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
          <p className={`text-lg font-bold ${account.currentBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatCurrency(account.currentBalance)}
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