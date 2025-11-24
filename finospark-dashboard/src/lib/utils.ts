import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_INR_FORMAT: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
};

export function formatInr(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    ...DEFAULT_INR_FORMAT,
    ...options,
  });
  return formatter.format(value || 0);
}
