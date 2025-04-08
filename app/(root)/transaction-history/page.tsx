import HeaderBox from '@/components/ui/HeaderBox'
import { Pagination } from '@/components/ui/Pagination';
import TransactionsTable from '@/components/ui/TransactionsTable';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { formatAmount } from '@/lib/utils';
import React from 'react'

const TransactionHistory = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({ userId: loggedIn.$id });

  if (!accounts) return;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  const account = await getAccount({ appwriteItemId });

  const rowsPerPage = 10;
  const totalPages = Math.ceil(account?.transactions.length / rowsPerPage);
  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = account?.transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  return (
    <div className='transaction'>
      <div className='transaction-header'>
        <HeaderBox
          title='Transaction History'
          subtext='View your transaction history and manage your transactions.'
        />
      </div>
      <div className='space-y-6'>
        <div className='transaction-account'>
          <div className='flex flex-col gap-2'>
            <h2 className='text-18 font-bold text-white'>
              {account?.data.name}
            </h2>
            <p className='test-14 text-blue-25'>
              {account?.data.officialName}
            </p>
            <p className='text-14 font-semibold tracking[1.1px] text-white'>
              **** **** **** ****{account?.data.mask}
            </p>
          </div>
          <div className='transaction-account_balance'>
            <p className='text-14'>
              Current Balance
            </p>
            <p className='text-24 text-center font-bold'>
              {formatAmount(account?.data.currentBalance)}
            </p>
          </div>
        </div>
        <section className='flex w-full flex-col gap-6'>
          <TransactionsTable 
            transactions={account?.transactions}
          />
          {totalPages > 1 && (
            <div className='my-4 w-full'>
              <Pagination totalPages={totalPages} page={currentPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default TransactionHistory