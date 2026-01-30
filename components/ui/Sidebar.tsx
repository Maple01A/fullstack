'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Link href='/'
            className='mb-8 cursor-pointer items-center gap-2 flex pl-4'>
            <Image
              src='/icons/logo.png'
              width={34}
              height={34}
              alt='Logo'
              className='w-8 h-8'
            />
            <h1 className='sidebar-logo text-xl font-semibold text-gray-800'>
              Balance
            </h1>
          </Link>
        </motion.div>

        <div className='flex flex-col gap-2'>
          {sidebarLinks.map((item, index) => {
            const isActive = pathname === item.route ||
              pathname.startsWith(`${item.route}/`);

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={item.route}
                  className={cn(
                    'sidebar-link transition-all duration-200 flex items-center gap-3 p-3 mx-2 rounded-lg',
                    { 'bg-blue-50 text-blue-700 border border-blue-100': isActive },
                    { 'text-gray-600 hover:bg-gray-50 hover:text-gray-900': !isActive }
                  )}
                >
                  <div className='relative w-6 h-6 flex-shrink-0'>
                    <Image
                      src={item.imgURL}
                      alt={item.label}
                      fill
                      className={cn(
                        'transition-all duration-200',
                        { 'opacity-100': isActive },
                        { 'opacity-60': !isActive }
                      )}
                    />
                  </div>
                  <p className={cn(
                    'sidebar-label font-medium transition-colors duration-200', 
                    { 'text-blue-700': isActive },
                    { 'text-gray-600': !isActive }
                  )}>
                    {item.label}
                  </p>
                </Link>
              </motion.div>
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