'use client';

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import CustomInput from '@/components/ui/CustomInput'
import { authFormSchema } from '@/lib/utils'
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getLoggedInUser, singIn as signIn, singUp as signUp } from '@/lib/actions/user.client.actions'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/superbase'
import { formVariants, inputVariants, buttonVariants, messageVariants } from '@/lib/authAnimations'

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(type === 'sign-up' ? {
        firstName: '',
        lastName: '',
      } : {})
    },
  });

  const handleAuthSuccess = async (response: any) => {
    setAuthSuccess("認証に成功しました。リダイレクトしています...");
    setFormSubmitted(true);

    try {
      // リダイレクト先を確認 (クエリパラメータがあればそこに、なければホームページに)
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect') || '/';

      // セッション確認
      const { data: sessionData } = await supabase.auth.getSession();
      console.log(`認証成功後のセッション: ${sessionData.session ? "有効" : "無効"}`);

      // リダイレクト - 常にホームページに遷移
      setTimeout(() => {
        window.location.href = '/';  // ホームページに固定
      }, 1500);
    } catch (error) {
      console.error("セッション確認エラー:", error);
      window.location.href = '/'; // エラー時もホームに
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      if (type === 'sign-up') {
        const { data: newUser, error } = await signUp(data);
        
        if (error) {
          setAuthError(error);
          setIsLoading(false);
          return;
        }

        setUser(newUser);
        setAuthSuccess("アカウント登録が完了しました！ログインページにリダイレクトします");
        setFormSubmitted(true);
        
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      }
      
      if (type === 'sign-in') {
        const { data: response, error } = await signIn({
          email: data.email,
          password: data.password,
        });

        if (error) {
          setAuthError(error);
          setIsLoading(false);
          return;
        }

        handleAuthSuccess(response);
      }
    } catch (error) {
      console.log(error);
      setAuthError("処理中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='auth-form'>
      <motion.header 
        className='flex flex-col gap-5 md:gap-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href='/' className='cursor-pointer flex items-center gap-1'>
          <motion.div
            initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            whileHover={{ 
              rotate: [0, -10, 0],
              transition: { duration: 0.5 }
            }}
          >
            <Image
              src='/icons/logo.svg'
              width={34}
              height={34}
              alt='logo'
            />
          </motion.div>
          <h1 className='text-26 font-ibm-plex-serif font-bold text-black-1'>Horizon</h1>
        </Link>

        <div className='flex flex-col gap-1 md:gap-3'>
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {type === 'sign-in' ? 'サインイン' : '新規登録'}
          </h1>
          <p className='text-16 font-normal text-gray-600'>
            必要な情報を入力してください
          </p>
        </div>
      </motion.header>

      <AnimatePresence>
        {authError && (
          <motion.div 
            className="p-3 my-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AlertCircle size={18} />
            <span>{authError}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {authSuccess && (
          <motion.div 
            className="p-3 my-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle size={18} />
            <span>{authSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {formSubmitted && authSuccess ? (
        <motion.div
          className="mt-8 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, times: [0, 0.8, 1] }}
          >
            <CheckCircle size={32} className="text-green-600" />
          </motion.div>
          
          <motion.div 
            className="w-full max-w-xs bg-gray-200 h-2 rounded-full overflow-hidden mt-4"
          >
            <motion.div
              className="bg-green-500 h-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5 }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <Form {...form}>
          <motion.form 
            onSubmit={form.handleSubmit(onSubmit)}
            className={`space-y-8 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
            variants={formVariants}
            initial="hidden"
            animate={formSubmitted ? "success" : "visible"}
          >
            {type === 'sign-up' && (
              <>
                <motion.div 
                  className="flex gap-4"
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  <CustomInput control={form.control} name='firstName' label="姓" placeholder='例: 山田' />
                  <CustomInput control={form.control} name='lastName' label="名" placeholder='例: 太郎' />
                </motion.div>
              </>
            )}

            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              custom={type === 'sign-up' ? 1 : 0}
            >
              <CustomInput control={form.control} name='email' label="メールアドレス" placeholder='例: your@email.com' />
            </motion.div>

            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              custom={type === 'sign-up' ? 2 : 1}
              className="relative"
            >
              <CustomInput 
                control={form.control} 
                name='password' 
                label="パスワード" 
                placeholder='8文字以上の英数字'
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                title={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </motion.div>

            <motion.div 
              className="flex flex-col gap-4"
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              custom={type === 'sign-up' ? 3 : 2}
            >
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="form-btn w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      <span>処理中...</span>
                    </div>
                  ) : type === 'sign-in' ? 'ログイン' : '新規登録'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </Form>
      )}

      <motion.footer 
        className="flex justify-center gap-1 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p className="text-14 font-normal text-gray-600">
          {type === 'sign-in'
            ? "アカウントをお持ちでない方は"
            : "既にアカウントをお持ちの方は"}
        </p>
        <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className="form-link text-indigo-600 hover:text-indigo-800 transition-colors font-medium">
          {type === 'sign-in' ? '新規登録' : 'ログイン'}
        </Link>
      </motion.footer>
    </section>
  );
};

export default AuthForm;