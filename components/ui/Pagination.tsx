'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ページ変更ハンドラー
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    router.push(`?${params.toString()}`);
  };

  // ページ番号配列を生成
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // 全ページ表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);

      // 現在のページの周辺
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);

      // 最初のページと現在のページの間にギャップがある場合
      if (startPage > 2) {
        pages.push('...');
      }

      // 中央のページ
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 現在のページと最後のページの間にギャップがある場合
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // 最後のページ
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => changePage(page - 1)}
        disabled={page <= 1}
        className="w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">前のページ</span>
      </Button>

      {getPageNumbers().map((pageNum, idx) => (
        pageNum === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2">...</span>
        ) : (
          <Button
            key={`page-${pageNum}`}
            variant={page === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => changePage(pageNum as number)}
            className={`w-9 p-0 ${page === pageNum ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {pageNum}
          </Button>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => changePage(page + 1)}
        disabled={page >= totalPages}
        className="w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">次のページ</span>
      </Button>
    </div>
  );
}