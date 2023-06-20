import get from "lodash/get";
import WebinyError from "@webiny/error";

import { PbAcoContext } from "~/types";

export const getFolderHierarchyByPageId = async (context: PbAcoContext, pageId: string) => {
    try {
        const { aco, pageBuilder } = context;

        const page = await pageBuilder.getPage(pageId);

        if (!page) {
            return [];
        }

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
