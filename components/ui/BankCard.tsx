'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatAmount } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './dropdown-menu';

interface BankCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
  showActions?: boolean;
}

const BankCard = ({ account, userName, showBalance = true, showActions = true }: BankCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // サーバーアクションを直接インポートする代わりに、フォームデータを使ってPOSTリクエストを送信
      const response = await fetch(`/api/bank/delete?id=${account.appwriteItemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('口座の削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/my-banks/edit/${account.appwriteItemId}`);
  };

  const   handleView = () => {
    router.push(`/my-banks/${account.appwriteItemId}`);
  };

  // 銀行タイプに基づく色とスタイルを取得
  const getBankStyle = () => {
    switch (account.type) {
      case 'credit':
        return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
      case 'loan':
        return 'bg-gradient-to-r from-red-500 to-red-700 text-white';
      case 'investment':
        return 'bg-gradient-to-r from-green-500 to-green-700 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
    }
  };

  // 口座番号をフォーマットする関数
  const formatAccountNumber = (number: string) => {
    if (account.type === 'credit') {
      // クレジットカード番号は**** **** **** 1234のような形式にフォーマット
      return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '**** **** **** $4');
    }
    // その他の口座番号は末尾4桁のみ表示
    return `****${number.slice(-4)}`;
  };

  return (
    <div 
      className={`relative rounded-xl p-6 w-80 h-48 shadow-md cursor-pointer ${getBankStyle()}`}
      onClick={handleView}
    >
      {/* カード上部 */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">{account.name}</h3>
          <p className="text-sm opacity-80">{account.officialName}</p>
        </div>
        
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-1 rounded-full bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()} // イベントバブリングを防止
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" sideOffset={5}>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-gray-100"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleView(); 
                }}
              ><MoreHorizontal size={16} className="mr-2" />
                詳細を見る
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-gray-100"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleEdit(); 
                }}
              >
                <Edit size={16} className="mr-2" /> 編集
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500 cursor-pointer hover:bg-gray-100"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDelete(); 
                }}
                disabled={isDeleting}
              >
                <Trash2 size={16} className="mr-2" /> {isDeleting ? '削除中...' : '削除'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* カード中央 - 口座番号表示 */}
      <div className="mt-6">
        {account.accountNumber && 
          !(['paypay', 'paidy'].includes(account.type) || account.icon === 'wallet') && (
            <>
              <p className="text-sm opacity-80">
                {account.type === 'credit' ? 'カード番号' : '口座番号'}
              </p>
              <p className="font-medium">
                {formatAccountNumber(account.accountNumber)}
              </p>
            </>
          )
        }
      </div>
      
      {/* カード下部 */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm opacity-80">名義</p>
            <p className="text-sm font-medium">{userName}</p>
          </div>
          {showBalance && (
            <div className="text-right">
              <p className="text-sm opacity-80">残高</p>
              <p className="text-lg font-bold">{formatAmount(account.currentBalance)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankCard;