'use client';

import { type ClassValue, clsx } from "clsx";
import qs from "query-string";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

/**
 * Tailwindのクラスをマージするためのユーティリティ
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付フォーマット関連の関数
 */
export function formatDateTime(dateString: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(dateString);
}

export function formatDateOnly(dateString: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateString);
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * 金額フォーマット関数
 */
export function formatCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '¥0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(numAmount);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * URLクエリパラメータ関連関数
 */
interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);
  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  );
}

/**
 * 口座タイプに応じたスタイル
 */
export function getAccountTypeColors(type: AccountTypes) {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };
    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      };
    default:
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      };
  }
}

/**
 * トランザクションのカテゴリ集計
 */
export function countTransactionCategories(transactions: Transaction[]): CategoryCount[] {
  if (!transactions || !transactions.length) return [];
  
  const categoryCounts: Record<string, number> = {};
  let totalCount = 0;

  transactions.forEach(({ category }) => {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    totalCount++;
  });

  return Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count, totalCount }))
    .sort((a, b) => b.count - a.count);
}

/**
 * トランザクションのステータス判定
 */
export function getTransactionStatus(date: Date) {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo ? "Processing" : "Success";
}

/**
 * 認証フォームスキーマ
 */
export function authFormSchema(type: string) {
  if (type === 'sign-up') {
    return z.object({
      firstName: z.string().min(1, "名前は必須です"),
      lastName: z.string().min(1, "姓は必須です"),
      email: z.string().email("有効なメールアドレスを入力してください"),
      password: z.string().min(6, "パスワードは6文字以上必要です"),
    });
  }

  return z.object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z.string().min(1, "パスワードを入力してください"),
  });
}

/**
 * 文字列関連のユーティリティ
 */
export function removeSpecialCharacters(str?: string): string {
  if (!str) return '';
  return str.replace(/[^\p{L}\p{N}\s]/gu, '');
}

/**
 * ID暗号化/復号
 */
export function encryptId(id: string) {
  return btoa(id);
}

export function decryptId(id: string) {
  return atob(id);
}

/**
 * デバッグ用ユーティリティ
 */
export function debugLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

