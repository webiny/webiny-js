// @flow
import { useContext } from "react";
import { PageDetailsContext } from "../context/PageDetailsContext";

export function usePageDetails() {
    return useContext(PageDetailsContext);
}
