import EditBankForm from '@/components/ui/EditBankForm';
import HeaderBox from '@/components/ui/HeaderBox';
import { getAccount } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface EditBankPageProps {
  params: {
    id: string;
  };
}

const EditBankPage = async ({ params }: EditBankPageProps) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  const accountData = await getAccount({ appwriteItemId: params.id });

  if (!accountData || !accountData.data) {
    return redirect('/my-banks');
  }

  return (
    <section className='flex flex-col w-full'>
      <div className='p-6'>
        <Link href="/my-banks" className="flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft size={16} />
          口座一覧に戻る
        </Link>
        
        <HeaderBox
          title='口座情報の編集'
          subtext={`${accountData.data.name} (${accountData.data.officialName})`}
        />
        
        <div className="mt-8">
          <EditBankForm account={accountData.data} />
        </div>
      </div>
    </section>
  );
};

export default EditBankPage; 