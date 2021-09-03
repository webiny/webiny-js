import { IndexPageDataPlugin } from "~/plugins/definitions/IndexPageDataPlugin";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { Page } from "@webiny/api-page-builder/types";
import lodashGet from "lodash/get";

export const getESPageData = (page: Page) => {
    return {
        __type: "page",
        tenant: page.tenant,
        webinyVersion: page.webinyVersion,
        id: page.id,
        pid: page.pid,
        editor: page.editor,
        locale: page.locale,
        createdOn: page.createdOn,
        savedOn: page.savedOn,
        createdBy: page.createdBy,
        ownedBy: page.ownedBy,
        category: page.category,
        version: page.version,
        title: page.title,
        titleLC: page.title.toLowerCase(),
        path: page.path,
        status: page.status,
        locked: page.locked,
        publishedOn: page.publishedOn,

        // Pull tags & snippet from settings.general.
        tags: lodashGet(page, "settings.general.tags") || [],
        snippet: lodashGet(page, "settings.general.snippet") || null,

        // Save some images that could maybe be used on listing pages.
        images: {
            general: lodashGet(page, "settings.general.image")
        }
    };
};

export const getESLatestPageData = (context: PbContext, page: Page) => {
    const data = { ...getESPageData(page), latest: true };
    return modifyData(data, page, context);
};

export const getESPublishedPageData = (context: PbContext, page: Page) => {
    const data = { ...getESPageData(page), published: true };
    return modifyData(data, page, context);
};

const modifyData = (data: Record<string, any>, page: Page, context: PbContext) => {
    const pagePlugins = context.plugins.byType<IndexPageDataPlugin>(IndexPageDataPlugin.type);

    for (const plugin of pagePlugins) {
        plugin.apply({ context, page, data });
    }

    return data;
};
