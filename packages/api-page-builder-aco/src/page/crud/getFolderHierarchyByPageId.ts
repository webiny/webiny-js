import get from "lodash/get";
import WebinyError from "@webiny/error";

import { PbAcoContext, PbPageRecordData } from "~/types";
import { Page } from "@webiny/api-page-builder/types";
import { PB_PAGE_TYPE } from "~/contants";

export const getFolderHierarchyByPageId = async (context: PbAcoContext, page: Page) => {
    try {
        const { aco } = context;
        const app = aco.getApp(PB_PAGE_TYPE);

        const record = await app.search.get<PbPageRecordData>(page.pid);
        const folderId = get(record, "location.folderId");

        if (!folderId) {
            return [];
        }

        return aco.folder.getHierarchyById(folderId);
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while executing getFolderHierarchyByPageId",
            code: "ACO_GET_FOLDER_HIERARCHY_BY_PAGE_ID"
        });
    }
};
