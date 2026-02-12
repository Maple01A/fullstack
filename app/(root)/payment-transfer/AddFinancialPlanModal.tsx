'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/Sheet';
import AddFinancialPlanForm from '@/components/ui/AddFinancialPlanForm';
import { Plus, Calendar, X } from 'lucide-react';
import * as SheetPrimitive from "@radix-ui/react-dialog";
import type { Account } from '@/types';

interface AddFinancialPlanModalProps {
  userId: string;
  accounts: Account[];
}

export default function AddFinancialPlanModal({ userId, accounts }: AddFinancialPlanModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="flex items-center gap-2 shadow-md w-full sm:w-auto px-5 py-6 ml-auto bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">
          <Plus size={18} />
          <span className="font-medium">収支予定を追加</span>
        </Button>
      </SheetTrigger>
      <SheetPortal>
        <SheetOverlay className="bg-white/70"/>
        <SheetPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <SheetTitle className="sr-only">収支予定の追加</SheetTitle>
          
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">閉じる</span>
          </button>
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">収支予定の追加</h2>
                <p className="text-sm text-gray-500 mt-1">
                  収支予定の情報を入力してください
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <AddFinancialPlanForm 
              userId={userId} 
              accounts={accounts}
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}
