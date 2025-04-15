import React from 'react'
import Image from 'next/image'
import { signOut } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
  const router = useRouter();
  
  const handleLogOut = async () => {
    try {
      const loggedOut = await signOut();
      
      if (loggedOut) {
        router.push('/sign-in');
      } else {
        console.error('ログアウトに失敗しました');
      }
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました:', error);
    }
  }

  return (
    <footer className='footer'>
      <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
        <p className='text-xl font-bold text-gray-700'>
          {user?.firstName?.[0] || '?'}
        </p>
      </div>

      <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
        <h1 className='text-14 truncate text-gray-600 font-semibold'>
          {user?.firstName || 'ユーザー'} {user?.lastName || ''}
        </h1>
        <p className='text-14 truncate font-normal text-gray-600'>
          {user?.email || 'メールアドレスがありません'}
        </p>
      </div>
      <div className='footer_image' onClick={handleLogOut}>
        <Image src='/icons/logout.svg' fill alt='ログアウト'/>
      </div>
    </footer>
  )
}

export default Footer