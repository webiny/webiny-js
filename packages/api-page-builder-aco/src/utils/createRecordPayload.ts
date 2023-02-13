import { Page } from "@webiny/api-page-builder/types";

import { PB_PAGE_TYPE, ROOT_FOLDER } from "~/contants";

import { PbPageRecordData } from "~/types";
import {
    CreateSearchRecordParams,
    UpdateSearchRecordParams
} from "@webiny/api-aco/entities/record/record.types";

export const createPageRecordPayload = (
    page: Page,
    folderId = ROOT_FOLDER
): CreateSearchRecordParams<PbPageRecordData> => {
    const { id, pid, title, content, createdOn, createdBy, savedOn, status, version, locked } =
        page;

    return {
        originalId: pid,
        type: PB_PAGE_TYPE,
        title: title,
        content: content?.content,
        location: {
            folderId
        },
        data: {
            id,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked
        }
    };
};

export const updatePageRecordPayload = (
    page: Page,
    folderId = ROOT_FOLDER
): UpdateSearchRecordParams<PbPageRecordData> => {
    const { id, title, content, createdOn, createdBy, savedOn, status, version, locked } = page;

    return {
        title: title,
        content: content?.content,
        location: {
            folderId
        },
        data: {
            id,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked
        }
    };
};
