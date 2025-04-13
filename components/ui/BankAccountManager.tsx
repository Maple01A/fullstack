'use client';

import { useState } from 'react';
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import Add from '@/components/ui/Add';

interface BankAccountManagerProps {
  initialAccounts?: Array<{ name: string; balance: number }>;
}

const BankAccountManager = ({ initialAccounts = [] }: BankAccountManagerProps) => {
  const [accounts, setAccounts] = useState<Array<{ name: string; balance: number }>>(initialAccounts);

  const handleAddAccount = (account: { name: string; balance: number }) => {
    setAccounts([...accounts, account]);
  };

  // 口座の数と総残高を計算
  const totalBanks = accounts.length;
  const totalCurrentBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="relative">
      <TotalBalanceBox
        accounts={[]}
        totalBanks={totalBanks}
        totalCurrentBalance={totalCurrentBalance}
      />
      <div className="absolute top-4 right-4">
        <Add onAddAccount={handleAddAccount} />
      </div>
    </div>
  );
};

export default BankAccountManager;