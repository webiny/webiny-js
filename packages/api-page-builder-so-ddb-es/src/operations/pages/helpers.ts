import lodashGet from "lodash/get";
import { IndexPageDataPlugin } from "~/plugins/definitions/IndexPageDataPlugin";
import { Page } from "@webiny/api-page-builder/types";
import { PluginsContainer } from "@webiny/plugins";

/**
 * Map our system fields to the Elasticsearch data.
 * We need to add new fields if we add them into our system.
 */
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

export const getESLatestPageData = (
    plugins: PluginsContainer,
    page: Page,
    input: Record<string, any> = {}
) => {
    const data = { ...getESPageData(page), latest: true };
    return modifyData({ data, page, plugins, input });
};

export const getESPublishedPageData = (
    plugins: PluginsContainer,
    page: Page,
    input: Record<string, any> = {}
) => {
    const data = { ...getESPageData(page), published: true };
    return modifyData({ data, page, plugins, input });
};

interface ModifyDataParams {
    input: Record<string, any>;
    data: Record<string, any>;
    page: Page;
    plugins: PluginsContainer;
}

const modifyData = (params: ModifyDataParams) => {
    const { data, page, plugins, input } = params;
    const pagePlugins = plugins.byType<IndexPageDataPlugin>(IndexPageDataPlugin.type);

    for (const plugin of pagePlugins) {
        plugin.apply({ page, data, plugins, input });
    }

    return data;
};
