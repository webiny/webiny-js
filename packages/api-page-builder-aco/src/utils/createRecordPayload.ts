import { PB_PAGE_TYPE, ROOT_FOLDER } from "~/contants";

import {
    CreateSearchRecordParams,
    UpdateSearchRecordParams
} from "@webiny/api-aco/record/record.types";
import { Page } from "@webiny/api-page-builder/types";
import { PbAcoContext, PbPageRecordData } from "~/types";

export const createPageRecordPayload = async (
    context: PbAcoContext,
    page: Page,
    meta?: Record<string, any>
): Promise<CreateSearchRecordParams<PbPageRecordData>> => {
    const { id, pid, title, createdOn, createdBy, savedOn, status, version, locked } = page;
    const content = await context.pageBuilderAco.processPageSearchContent(page);
    const location = {
        folderId: meta?.location?.folderId || ROOT_FOLDER
    };

    return {
        originalId: pid,
        type: PB_PAGE_TYPE,
        title,
        content,
        location,
        data: {
            id,
            title,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked
        }
    };
};

export const updatePageRecordPayload = async (
    context: PbAcoContext,
    page: Page,
    meta?: Record<string, any>
): Promise<UpdateSearchRecordParams<PbPageRecordData>> => {
    const { id, title, createdOn, createdBy, savedOn, status, version, locked } = page;
    const content = await context.pageBuilderAco.processPageSearchContent(page);

    return {
        title,
        content,
        data: {
            id,
            title,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked
        },
        ...(meta && { ...meta })
    };
};
