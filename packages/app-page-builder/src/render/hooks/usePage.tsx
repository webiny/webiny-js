import { useContext } from "react";
import { PbPageData } from "../../types";
import { PageContext } from "../contexts/Page";

export function usePage(): PbPageData {
    return useContext(PageContext);
}
