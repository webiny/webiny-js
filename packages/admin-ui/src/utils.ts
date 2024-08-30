import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const generateId = (initialId?: string): string => {
    if (initialId !== undefined && initialId !== null) {
        return String(initialId);
    }
    return "wby-" + Math.random().toString(36).slice(2, 9);
};
