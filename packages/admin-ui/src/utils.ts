import { clsx, type ClassValue } from "clsx";
import { generateId as baseGenerateId } from "@webiny/utils/generateId";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const generateId = (initialId?: string) => {
    if (initialId) {
        return initialId;
    }
    return "wby-" + baseGenerateId(4);
};
