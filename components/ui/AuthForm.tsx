'use client';

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { authFormSchema } from '@/lib/utils';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLoggedInUser, signIn, signUp } from '../../lib/actions/user.client.actions';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/superbase';

// CustomInput.tsx が正しくエラーメッセージを表示しているか確認
const CustomInput = ({ control, name, label, placeholder, type = 'text' }: CustomInputProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex-1">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <input
              type={type}
              placeholder={placeholder}
              className={`input-field w-full px-4 py-2 border ${fieldState.error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  type UserType = {
    $id: string;
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 現在のセッションを確認
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('既存のセッションが見つかりました:', data.session.user.id);
        } else {
          console.log('セッションが見つかりません');
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
      }
    };
    
    checkSession();
  }, []);

  // アニメーション設定
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    success: {
      scale: [1, 1.02, 1],
      boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(0,255,0,0.3)", "0px 0px 0px rgba(0,0,0,0)"],
      transition: {
        duration: 0.5
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5
      }
    })
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const messageVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      marginTop: 12, 
      marginBottom: 12,
      transition: { duration: 0.3 } 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginTop: 0, 
      marginBottom: 0,
      transition: { duration: 0.2 } 
    }
  };

  const formSchema = authFormSchema(type);

  // フォームの初期化部分
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched', // フィールドにフォーカスが当たった後にバリデーション
    reValidateMode: 'onChange', // 値が変更されるたびに再検証
    defaultValues: {
      email: "",
      password: '',
      ...(type === 'sign-up' ? {
        firstName: '',
        lastName: '',
      } : {})
    },
  });

  // フォーム送信の強化
  const handleFormSubmit = async () => {
    // 手動で全フィールドを検証
    const validation = await form.trigger();
    console.log("フォーム全体の検証結果:", validation);
    
    if (!validation) {
      console.log("バリデーションエラー:", form.formState.errors);
      setAuthError("入力内容に誤りがあります。各フィールドを確認してください。");
      return false;
    }
    
    return true;
  };

  // 認証状態の変更を監視
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // ユーザーがサインインしたとき
        console.log('ユーザーがサインインしました', session.user);
      } else if (event === 'SIGNED_OUT') {
        // ユーザーがサインアウトしたとき
        console.log('ユーザーがサインアウトしました');
      }
    });

    return () => {
      // クリーンアップ
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 成功後のリダイレクト
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (formSubmitted && (authSuccess || user)) {
      redirectTimer = setTimeout(() => {
        if (type === 'sign-up') {
          router.push('/sign-in');
        } else {
          router.push('/');
        }
      }, 1500);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [formSubmitted, authSuccess, user, type, router]);

  // onSubmit関数の最初で呼び出す
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("フォーム送信開始:", data);
    
    // 追加の検証を実行
    const isFormValid = await handleFormSubmit();
    if (!isFormValid) {
      return;
    }
    
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (type === 'sign-up') {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          username: data.firstName! + data.lastName!,
          email: data.email,
          password: data.password,
        }

        console.log("サインアップ試行:", userData.email);
        
        try {
          const newUser = await signUp(userData);
          console.log("サインアップ応答:", newUser);
          
          if (!newUser) {
            setAuthError("アカウント作成に失敗しました。入力情報を確認してください。");
            setIsLoading(false);
            return;
          }

          console.log("サインアップ成功:", newUser);
          
          setFormSubmitted(true);
          setAuthSuccess("アカウントが作成されました。ログインページに移動します。");
          setUser(newUser);
        } catch (signupError) {
          console.error("サインアップエラー:", signupError);
          setAuthError("サインアップ中にエラーが発生しました。もう一度お試しください。");
          setIsLoading(false);
        }
      }

      // サインイン処理（追加）
      if (type === 'sign-in') {
        console.log("ログイン試行:", data.email);
        
        try {
          const response = await signIn({
            email: data.email,
            password: data.password,
          });

          console.log("ログイン応答:", response);

          // エラーハンドリング
          if (!response) {
            setAuthError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
            return;
          }

          if (response.error) {
            setAuthError(response.message || "ログインエラーが発生しました。");
            return;
          }

          // 成功時の処理
          console.log("ログイン成功:", response);
          setFormSubmitted(true);
          setAuthSuccess("ログインに成功しました。ホーム画面に移動します。");
          setUser(response);

          // セッションストレージにログイン状態を保存
          sessionStorage.setItem('login_success', 'true');
          
          // リダイレクト
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } catch (loginError) {
          console.error("ログイン処理エラー:", loginError);
          setAuthError("ログイン中にエラーが発生しました。もう一度お試しください。");
        }
      }
      
    } catch (error) {
      console.error("フォーム送信エラー:", error);
      setAuthError("予期せぬエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-form">
      <motion.header 
        className='flex flex-col gap-5 md:gap-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon logo"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Horizon</h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {user
              ? 'Link Account'
              : type === 'sign-in'
                ? 'Sign In'
                : 'Sign Up'
            }
            <p className="text-16 font-normal text-gray-600">
              {user
                ? 'Link your account to get started'
                : 'Please enter your details'
              }
            </p>
          </h1>
        </div>
      </motion.header>
      {user && formSubmitted ? (
        <motion.div 
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {authSuccess && (
              <motion.div 
                className="p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2"
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
        </motion.div>
      ) : (
        <>
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
                    <CustomInput control={form.control} name='firstName' label="First Name" placeholder='Enter your first name' />
                    <CustomInput control={form.control} name='lastName' label="Last Name" placeholder='Enter your last name' />
                  </motion.div>
                </>
              )}

              <motion.div
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                custom={type === 'sign-up' ? 5 : 0}
              >
                <CustomInput control={form.control} name='email' label="Email" placeholder='Enter your email' />
              </motion.div>

              <motion.div
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                custom={type === 'sign-up' ? 6 : 1}
                className="relative"
              >
                <CustomInput 
                  control={form.control} 
                  name='password' 
                  label="Password" 
                  placeholder='Enter your password'
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
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
                custom={type === 'sign-up' ? 7 : 2}
              >
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button 
                    type="submit" 
                    disabled={isLoading || form.formState.isSubmitting} 
                    className="form-btn w-full"
                  >
                    {isLoading || form.formState.isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin mr-2" />
                        <span>Loading...</span>
                      </div>
                    ) : type === 'sign-in'
                      ? 'Sign In' : 'Sign Up'}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>
          </Form>

          <motion.footer 
            className="flex justify-center gap-1 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-14 font-normal text-gray-600">
              {type === 'sign-in'
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className="form-link text-indigo-600 hover:text-indigo-800 transition-colors font-medium">
              {type === 'sign-in' ? 'Sign up' : 'Sign in'}
            </Link>
          </motion.footer>
        </>
      )}
    </section>
  )
}

export default AuthForm
