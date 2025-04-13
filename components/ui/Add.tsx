"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

interface AddAccountProps {
  onAddAccount: (account: { name: string, balance: number }) => void;
}

const AddAccount = ({ onAddAccount }: AddAccountProps) => {
  const [newAccount, setNewAccount] = useState({ name: '', balance: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.balance > 0) {
      onAddAccount(newAccount);
      setNewAccount({ name: '', balance: 0 });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <PlusCircle className="h-4 w-4" />
          口座を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>口座を登録</DialogTitle>
          <DialogDescription>
            新しい口座情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              口座名
            </Label>
            <Input
              id="name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="col-span-3"
              placeholder="例: メイン口座"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              残高
            </Label>
            <Input
              id="balance"
              type="number"
              value={newAccount.balance || ''}
              onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
              className="col-span-3"
              placeholder="例: 10000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddAccount} type="submit">登録する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccount;