import { useContext } from "react";
import { PageBuilderContext } from "../context";

export function usePageBuilder() {
    return useContext(PageBuilderContext);
}
