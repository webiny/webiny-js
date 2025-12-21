import * as PAGES_GQL from "~tests/graphql/pages.gql.js";
import * as REDIRECTS_GQL from "~tests/graphql/redirects.gql.js";

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    locale?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface InvokeCallable {
    (params: InvokeParams): Promise<any>;
}

export const createWbSdk = (invoke: InvokeCallable) => {
    return {
        // Pages operations
        async createPage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.CREATE_PAGE, variables } });
        },
        async updatePage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.UPDATE_PAGE, variables } });
        },
        async publishPage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.PUBLISH_PAGE, variables } });
        },
        async unpublishPage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.UNPUBLISH_PAGE, variables } });
        },
        async duplicatePage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.DUPLICATE_PAGE, variables } });
        },
        async movePage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.MOVE_PAGE, variables } });
        },
        async createPageRevisionFrom(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.CREATE_PAGE_REVISION_FROM, variables } });
        },
        async deletePage(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.DELETE_PAGE, variables } });
        },
        async getPageByPath(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_PAGE_BY_PATH, variables } });
        },
        async getPageById(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_PAGE_BY_ID, variables } });
        },
        async getPageRevisions(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_PAGE_REVISIONS, variables } });
        },
        async listPages(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.LIST_PAGES, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_SETTINGS, variables } });
        },
        async updateSettings(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.UPDATE_SETTINGS, variables } });
        },
        async getIntegrations(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_INTEGRATIONS, variables } });
        },
        async updateIntegrations(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.UPDATE_INTEGRATIONS, variables } });
        },
        async getPageModel(variables = {}) {
            return invoke({ body: { query: PAGES_GQL.GET_PAGE_MODEL, variables } });
        },

        // Redirects operations
        async createRedirect(variables = {}) {
            return invoke({ body: { query: REDIRECTS_GQL.CREATE_REDIRECT, variables } });
        },
        async updateRedirect(variables = {}) {
            return invoke({ body: { query: REDIRECTS_GQL.UPDATE_REDIRECT, variables } });
        },
        async moveRedirect(variables = {}) {
            return invoke({ body: { query: REDIRECTS_GQL.MOVE_REDIRECT, variables } });
        },
        async deleteRedirect(variables = {}) {
            return invoke({ body: { query: REDIRECTS_GQL.DELETE_REDIRECT, variables } });
        },
        async listRedirects(variables = {}) {
            return invoke({ body: { query: REDIRECTS_GQL.LIST_REDIRECTS, variables } });
        }
    };
};
