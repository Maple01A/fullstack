import React from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table' 
import { cn, formatAmount, formatDateTime, getTransactionStatus, removeSpecialCharacters } from '@/lib/utils'
import { transactionCategoryStyles } from './constants'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
    const {
        backgroundColor,
        borderColor,
        textColor,
        chipBackgroundColor
    } = transactionCategoryStyles[category as keyof typeof transactionCategoryStyles] ||  transactionCategoryStyles.default

    return (
        <div className={cn('category-badge flex items-center gap-1 px-2 py-1 rounded-full', chipBackgroundColor)}>
            <div className={cn('size-2 rounded-full', backgroundColor)} />
            <p className={cn('text-[12px] font-medium', textColor)}>
            {category}</p>
        </div>
    )
}

const TransactionsTable = ({ transactions }: TransactionTableProps ) => {
  return (
    <Table>
        <TableHeader className='bg-gray-50'>
            <TableRow>
                <TableHead className='px-4 py-3 text-gray-700 font-medium'>
                    取引
                </TableHead>
                <TableHead className='px-4 py-3 text-gray-700 font-medium'>
                    金額
                </TableHead>
                <TableHead className='px-4 py-3 text-gray-700 font-medium'>
                    日付
                </TableHead>
                <TableHead className='px-4 py-3 text-gray-700 font-medium max-md:hidden'>
                    チャネル
                </TableHead>
                <TableHead className='px-4 py-3 text-gray-700 font-medium max-md:hidden'>
                    カテゴリー
                </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {transactions.map((t: Transaction) => {
                const status = getTransactionStatus(new Date(t.date))
                const amount = formatAmount(t.amount)

                const isDebit = t.type === 'debit';
                const isCredit = t.type === 'credit';
                
                return (
                    <TableRow 
                        key={t.id}
                        className={cn(
                            'hover:bg-gray-50 transition-colors',
                            isDebit ? 'bg-red-50/30' : isCredit ? 'bg-green-50/30' : ''
                        )}
                    >
                        <TableCell className='px-4 py-3'>
                            <div className='flex items-center gap-3'>
                                <div className={cn(
                                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                                    isDebit ? 'bg-red-100' : 'bg-green-100'
                                )}>
                                    {isDebit ? (
                                        <ArrowUpRight className='text-red-600 w-4 h-4' />
                                    ) : (
                                        <ArrowDownLeft className='text-green-600 w-4 h-4' />
                                    )}
                                </div>
                                <div>
                                    <h3 className='font-medium text-gray-900'>
                                        {removeSpecialCharacters(t.name)}
                                    </h3>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className='px-4 py-3'>
                            <span className={cn(
                                'font-medium',
                                isDebit ? 'text-red-600' : 'text-green-600'
                            )}>
                                {isDebit ? `-${amount}` : `+${amount}`}
                            </span>
                        </TableCell>
                        <TableCell className='px-4 py-3 text-gray-600'>
                            {formatDateTime(new Date(t.date)).dateTime}
                        </TableCell>
                        <TableCell className='px-4 py-3 text-gray-600 max-md:hidden'>
                            {t.paymentChannel === 'in_store' ? '店舗' : 
                             t.paymentChannel === 'online' ? 'オンライン' : 
                             t.paymentChannel}
                        </TableCell>
                        <TableCell className='px-4 py-3 max-md:hidden'>
                            <CategoryBadge category={t.category} />
                        </TableCell>
                    </TableRow>
                ) 
            })}
            
            {transactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className='text-center py-8 text-gray-500'>
                        取引履歴がありません
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
  )
}

export default TransactionsTable