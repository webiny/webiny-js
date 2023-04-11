import { FM_FILE_TYPE, ROOT_FOLDER } from "~/contants";

import {
    CreateSearchRecordParams,
    UpdateSearchRecordParams
} from "@webiny/api-aco/record/record.types";
import { File } from "@webiny/api-file-manager/types";
import { FmFileRecordData } from "~/types";

export const createFileRecordPayload = (
    file: File,
    requestMeta?: Record<string, any>
): CreateSearchRecordParams<FmFileRecordData> => {
    const { id, key, size, type, name, meta, createdOn, createdBy, tags } = file;
    const location = {
        folderId: requestMeta?.location?.folderId || ROOT_FOLDER
    };

    return {
        id,
        type: FM_FILE_TYPE,
        title: name,
        location,
        tags,
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

export const updatePageRecordPayload = async (
    file: File
): Promise<UpdateSearchRecordParams<FmFileRecordData>> => {
    const { id, key, size, type, name, meta, createdOn, createdBy, tags } = file;

    return {
        title: name,
        tags,
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
