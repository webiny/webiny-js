import { useCallback } from "react";
import { SelectRedirects } from "~/features/redirects/selectRedirects/SelectRedirects.js";

export const useSelectRedirects = <T = any>() => {
    const selectRedirects = useCallback((redirects: T[]) => {
        const instance = SelectRedirects.getInstance<T>();
        return instance.execute(redirects);
    }, []);

    return {
        selectRedirects
    };
};
