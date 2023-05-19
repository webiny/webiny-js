import { useContext } from "react";
import { PageContext } from "~/contexts/Page";

export function usePage() {
    const context = useContext(PageContext);
    if (!context) {
        throw Error(
            `PageContext was not found! Are you using the "usePage()" hook in the right place?`
        );
    }

    return context;
}

export function useOptionalPage() {
    return useContext(PageContext);
}
