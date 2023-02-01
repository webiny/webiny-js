import { createFolderCrudMethods } from "~/entities/folder/folder.crud";
import { createSearchRecordCrudMethods } from "~/entities/record/record.crud";

import { AdvancedContentOrganisation, CreateAcoParams } from "~/types";

export const createAcoCrud = (params: CreateAcoParams): AdvancedContentOrganisation => {
    const folderMethods = createFolderCrudMethods(params);
    const searchRecordMethods = createSearchRecordCrudMethods(params);

    return {
        folder: folderMethods,
        search: searchRecordMethods
    };
};
