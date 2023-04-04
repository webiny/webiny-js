import { FM_FILE_TYPE, ROOT_FOLDER } from "~/contants";

import { CreateSearchRecordParams } from "@webiny/api-aco/record/record.types";
import { File } from "@webiny/api-file-manager/types";
import { FmAcoContext, FmFileRecordData } from "~/types";

export const createFileRecordPayload = (
    context: FmAcoContext,
    file: File
): CreateSearchRecordParams<FmFileRecordData> => {
    const { id, key, size, type, name, meta, createdOn, createdBy, tags } = file;
    const location = {
        folderId: ROOT_FOLDER //TODO: fix this with the right folderId
    };

    return {
        id,
        type: FM_FILE_TYPE,
        title: name,
        location,
        data: {
            id,
            key,
            size,
            type,
            name,
            createdOn,
            createdBy,
            tags,
            meta
        }
    };
};
