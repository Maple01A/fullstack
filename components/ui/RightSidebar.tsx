import { Link } from 'lucide-react'
import React from 'react'
import Image from 'next/image'
import { countTransactionCategories } from '@/lib/utils'

export const RightSidebar = ({ user }: RightSidebarProps) => {
  // ダミーのカテゴリーデータ
  const dummyCategories = [
    { name: '食費', count: 5, totalCount: 10 },
    { name: '交通費', count: 3, totalCount: 10 },
    { name: '娯楽費', count: 2, totalCount: 10 },
  ];

  return (
    <aside className='right-sidebar'>
      <section className='flex flex-col pb-8'>
        <div className='profile-banner'/> 
        <div className='profile'>
          <div className='profile-img'>
            <span className='text-5xl font-bold text-blue-500'>{user.firstName[0]}</span>
          </div>
          <div className='profile-details'>
            <h1 className='profile-name'>
            {user.firstName} {user.lastName}
            </h1>
            <p className='profile-email'>
              {user.email}
            </p>
          </div>
        </div>
      </section>
      <section className='banks'>
        <div className='flex w-full justify-between'>
          <h2 className='header-2'>私の口座</h2>
          <Link href='/' className='flex gap-2'> 
          <Image
            src='/icons/plus.svg'
            width={20}
            height={20}
            alt='plus'
          />
          <h2 className='text-14 font-semibold text-gray-600'>
            講座を追加する
          </h2>
          </Link>
        </div>
        
        <div className='mt-10 flex flex-1 flex-col gap-6'>
          <h2 className='header-2'>
            カテゴリー
          </h2>
          <div className='space-y-5'>
            {dummyCategories.map((category) => (
              <div key={category.name} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                  <span className='text-body-medium'>{category.name}</span>
                </div>
                <span className='text-body-medium'>{category.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </aside>
  )
}

export default RightSidebar