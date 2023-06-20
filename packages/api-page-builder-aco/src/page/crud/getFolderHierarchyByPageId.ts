import get from "lodash/get";
import WebinyError from "@webiny/error";

import { PbAcoContext } from "~/types";
import { Page } from "@webiny/api-page-builder/types";

export const getFolderHierarchyByPageId = async (context: PbAcoContext, page: Page) => {
    try {
        const { aco } = context;

        const record = await aco.search.get(page.pid);
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
