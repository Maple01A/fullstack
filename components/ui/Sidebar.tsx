'use client';

import Link from 'next/link';
import Image from 'next/image';
import { sidebarLinks } from '@/components/ui/constants';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

interface SiderbarProps {
  user?: any;
}

const Sidebar = ({ user }: SiderbarProps) => {
  const pathname = usePathname();

  return (
    <section className='sidebar fixed h-screen flex flex-col justify-between'>
      <nav className='flex flex-col gap-4 overflow-y-auto py-8'>
        <Link href='/'
          className='mb-8 cursor-pointer items-center gap-2 flex pl-4'>
          <Image
            src='/icons/logo.svg'
            width={34}
            height={34}
            alt='Logo'
            className='w-8 h-8'
          />
          <h1 className='sidebar-logo text-xl font-semibold'>Horizon</h1>
        </Link>

        <div className='flex flex-col gap-2'>
          {sidebarLinks.map((item) => {
            const isActive = pathname === item.route || 
              pathname.startsWith(`${item.route}/`);
              
            return (
              <Link 
                href={item.route} 
                key={item.label}
                className={cn(
                  'sidebar-link transition-all duration-200 flex items-center gap-3 p-3 mx-2 rounded-lg',
                  {'bg-gradient-to-r from-blue-600 to-blue-800 text-white': isActive}
                )}
              >
                <div className='relative w-6 h-6 flex-shrink-0'>
                  <Image
                    src={item.imgURL}
                    alt={item.label}
                    fill
                    className={cn({
                      'brightness-[3] invert-0': isActive
                    })}
                  />
                </div>
                <p className={cn(
                  'sidebar-label text-gray-700', {'!text-white': isActive}
                )}>
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className='mt-auto'>
        <Footer user={user} />
      </div>
    </section>
  );
};

export default Sidebar;