// @flow
import { useContext } from "react";
import { PageDetailsContext } from "../../contexts/PageDetails";

export function usePageDetails() {
    return useContext(PageDetailsContext);
}
