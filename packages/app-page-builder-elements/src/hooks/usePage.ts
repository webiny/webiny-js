import { useContext } from "react";
import { PageContext } from "~/contexts/Page";
import { PageContextValue } from "~/types";

export function usePage(): PageContextValue {
    return useContext(PageContext);
}
