"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ja } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-lg shadow-lg", className)}
      locale={ja}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-5",
        caption: "flex justify-center pt-2 pb-3 relative items-center border-b border-gray-100",
        caption_label: "text-base font-medium text-gray-800",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white border border-gray-200 rounded-full p-0 hover:bg-blue-50 hover:border-blue-300"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-2",
        head_row: "flex",
        head_cell:
          "text-gray-500 rounded-md w-10 font-medium text-[0.8rem] py-2",
        row: "flex w-full mt-1",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full hover:bg-blue-50 aria-selected:opacity-100 aria-selected:bg-blue-100"
        ),
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
        day_today: "bg-blue-50 text-blue-700 font-medium border border-blue-200",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-300 opacity-50 line-through",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-5 w-5 text-gray-600" />,
        IconRight: () => <ChevronRight className="h-5 w-5 text-gray-600" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };