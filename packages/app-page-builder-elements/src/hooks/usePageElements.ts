import { useContext } from "react";
import { PageElementsContext, PageElementsContextValue } from "~/contexts/PageElements";

export function usePageElements(): PageElementsContextValue {
    return useContext(PageElementsContext);
}
