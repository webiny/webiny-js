import { useContext } from "react";
import { PageDetailsContext, PbPageDetailsContextValue } from "../../contexts/PageDetails";

export function usePageDetails(): PbPageDetailsContextValue {
    return useContext(PageDetailsContext);
}
