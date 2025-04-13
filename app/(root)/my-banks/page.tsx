import BankCard from '@/components/ui/BankCard';
import HeaderBox from '@/components/ui/HeaderBox'

import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

const MyBanks =  async () => {
  const loggedIn = await getLoggedInUser();


  return (
    <section className='flex'>
      <div className='my-banks'>
        <HeaderBox
          title='My Banks Accounts'
          subtext='Manage your banks and accounts'
        />
        <div className='space-y-4'>
          <h2 className='header-2'>
            Your Cards
          </h2>
          <div className='flex flex-wrap gap-6'>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks