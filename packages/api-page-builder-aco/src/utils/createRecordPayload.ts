import { PB_PAGE_TYPE, ROOT_FOLDER } from "~/contants";

import {
    CreateSearchRecordParams,
    UpdateSearchRecordParams
} from "@webiny/api-aco/record/record.types";
import { Page } from "@webiny/api-page-builder/types";
import { PbAcoContext, PbPageRecordData, PbCreatePayload, PbUpdatePayload } from "~/types";
import {
    PageBuilderAcoModifyCreatePayloadPlugin,
    PageBuilderAcoModifyUpdatePayloadPlugin
} from "~/plugins";

export const createPageRecordPayload = async (
    context: PbAcoContext,
    page: Page,
    meta?: Record<string, any>
): Promise<CreateSearchRecordParams<PbPageRecordData>> => {
    const {
        id,
        pid,
        title,
        createdOn,
        createdBy,
        savedOn,
        status,
        version,
        locked,
        path,
        settings
    } = page;
    const content = await context.pageBuilderAco.getSearchablePageContent(page);
    const location = {
        folderId: meta?.location?.folderId || ROOT_FOLDER
    };

    const payload: PbCreatePayload = {
        id: pid,
        type: PB_PAGE_TYPE,
        title,
        content,
        location,
        tags: settings.general?.tags || [],
        data: {
            id,
            pid,
            title,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked,
            path
        }
    };
    const plugins = context.plugins.byType<PageBuilderAcoModifyCreatePayloadPlugin>(
        PageBuilderAcoModifyCreatePayloadPlugin.type
    );
    for (const plugin of plugins) {
        await plugin.modifyPayload({
            plugins: context.plugins,
            payload,
            page
        });
    }
    return payload;
};

export const updatePageRecordPayload = async (
    context: PbAcoContext,
    page: Page
): Promise<UpdateSearchRecordParams<PbPageRecordData>> => {
    const {
        id,
        pid,
        title,
        createdOn,
        createdBy,
        savedOn,
        status,
        version,
        locked,
        path,
        settings
    } = page;
    const content = await context.pageBuilderAco.getSearchablePageContent(page);

    const payload: PbUpdatePayload = {
        title,
        content,
        tags: settings.general?.tags || [],
        data: {
            id,
            pid,
            title,
            createdBy,
            createdOn,
            savedOn,
            status,
            version,
            locked,
            path
        }
    };
    const plugins = context.plugins.byType<PageBuilderAcoModifyUpdatePayloadPlugin>(
        PageBuilderAcoModifyUpdatePayloadPlugin.type
    );
    for (const plugin of plugins) {
        await plugin.modifyPayload({
            plugins: context.plugins,
            payload,
            page
        });
    }
    return payload;
};
