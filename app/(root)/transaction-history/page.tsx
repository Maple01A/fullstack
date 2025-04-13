import HeaderBox from '@/components/ui/HeaderBox'
import { Pagination } from '@/components/ui/Pagination';
import TransactionsTable from '@/components/ui/TransactionsTable';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { formatAmount } from '@/lib/utils';
import React from 'react'

const TransactionHistory = async ({ searchParams: { id, page } }: SearchParamProps) => {

  return (
    <div className='transaction'>
    </div>
  )
}

export default TransactionHistory