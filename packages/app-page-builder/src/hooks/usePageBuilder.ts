import { useContext } from "react";
import { PageBuilderContext, PageBuilderContextValue } from "../contexts/PageBuilder";

export function usePageBuilder(): PageBuilderContextValue {
    return useContext(PageBuilderContext);
}
