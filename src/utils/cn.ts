import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally merge Tailwind CSS classes with deduplication.
 * 
 * Combines `clsx` for logical expressions and `twMerge` to eliminate conflicting Tailwind utility classes.
 * 
 * @param inputs - List of class values, objects, or arrays
 * @returns Combined and conflict-free CSS class string
 * 
 * @see https://github.com/lukeed/clsx
 * @see https://github.com/dcastil/tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
