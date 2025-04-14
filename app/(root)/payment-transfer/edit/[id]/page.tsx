import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getFinancialPlans } from '@/lib/actions/financial-plan.actions';
import { redirect, notFound } from 'next/navigation';
import FinancialPlanForm from '@/components/ui/FinancialPlanForm';

interface EditFinancialPlanPageProps {
  params: {
    id: string;
  };
}

const EditFinancialPlanPage = async ({ params }: EditFinancialPlanPageProps) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  // 口座情報を取得
  const { data: accounts } = await getAccounts({ userId: loggedIn.userId });

  // 編集する収支計画を取得
  const plans = await getFinancialPlans({});
  const plan = plans.find(p => p.id === params.id);

  if (!plan) {
    return notFound();
  }

  return (
    <div className='p-6'>
      <HeaderBox
        title='収支計画の編集'
        subtext='既存の収支計画を更新します'
      />

      <div className="mt-6 max-w-2xl mx-auto">
        <FinancialPlanForm accounts={accounts} existingPlan={plan} isEdit={true} />
      </div>
    </div>
  );
};

export default EditFinancialPlanPage; 