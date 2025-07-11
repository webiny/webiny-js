import { useCallback } from "react";
import { SelectPages } from "~/features/pages/selectPages/SelectPages.js";

export const useSelectPages = <T = any>() => {
    const selectPages = useCallback((pages: T[]) => {
        const instance = SelectPages.getInstance<T>();
        return instance.execute(pages);
    }, []);

    return {
        selectPages
    };
};
