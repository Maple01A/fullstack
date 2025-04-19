import React from 'react'
import Image from 'next/image'
import { logoutAccount } from '@/lib/actions/user.client.actions'
import { useRouter } from 'next/navigation'
import { FooterProps } from '@/types'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
  const router = useRouter();
  
  const handleLogOut = async () => {
    const loggedOut = await logoutAccount();
    if(loggedOut) router.push('/sign-in');
  }

  const displayName = user?.name ? 
    (typeof user.name === 'string' ? user.name[0] : (Array.isArray(user.name) ? user.name[0] : '?')) 
    : (user?.firstName?.[0] || '?');
  
  const fullName = user?.name || user?.firstName || 'ユーザー';
  const email = user?.email || 'メールアドレスなし';

  return (
    <footer className='footer'>
      <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
        <p className='text-xl font-bold text-gray-700'>
          {displayName}
        </p>
      </div>

      <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
        <h1 className='text-14 truncate text-gray-600 font-semibold'>
          {fullName}
        </h1>
        <p className='text-14 truncate font-normal text-gray-600'>
          {email}
        </p>
      </div>
      <div className='footer_image' onClick={handleLogOut}>
        <Image src='/icons/logout.svg' fill alt='logout'/>
      </div>
    </footer>
  )
}

export default Footer