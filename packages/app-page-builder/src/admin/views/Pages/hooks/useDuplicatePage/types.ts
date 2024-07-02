import { PbErrorResponse, PbPageData, PbPageDataItem, PbPageTableItem } from "~/types";
import { SearchRecordItem } from "@webiny/app-aco/table.types";
import { Location } from "@webiny/app-aco/types";

export type PageItem = PbPageTableItem | PbPageData | SearchRecordItem<PbPageDataItem>;

export const isPbPageData = (page: PageItem): page is PbPageData => {
    return "wbyAco_location" in page;
};

export interface DuplicatePageVariables {
    id: string;
    meta: {
        location: Location;
    };
}

export interface DuplicatePageResponse {
    pageBuilder: {
        duplicatePage: {
            data: PbPageData;
            error: PbErrorResponse;
        };
    };
}
