import type { IDataProvider, ListPagesOptions, ListPagesResult, PublicPage } from "~/types.js";
import type { ApiClient } from "~/dataProviders/ApiClient.js";
import { GET_PAGE_BY_PATH } from "./GET_PAGE_BY_PATH.js";
import { GET_PAGE_BY_ID } from "./GET_PAGE_BY_ID.js";
import { LIST_PUBLISHED_PAGES } from "./LIST_PUBLISHED_PAGES.js";

interface DefaultDataProviderConfig {
    apiClient: ApiClient;
}

const ignoreActions = [".well-known", "_next"];

export class DefaultDataProvider implements IDataProvider {
    private config: DefaultDataProviderConfig;

    constructor(config: DefaultDataProviderConfig) {
        this.config = config;
    }

    public async getPageByPath(path: string): Promise<PublicPage | null> {
        const result = await this.config.apiClient.query({
            query: GET_PAGE_BY_PATH,
            variables: {
                path
            }
        });

        this.checkForErrors(`getPageByPath:${path}`, result.websiteBuilder.getPageByPath);

        return result.websiteBuilder.getPageByPath.data;
    }

    public async getPageById(id: string): Promise<PublicPage | null> {
        const result = await this.config.apiClient.query({
            query: GET_PAGE_BY_ID,
            variables: {
                id
            }
        });

        this.checkForErrors("getPageById", result.websiteBuilder.getPageById);

        return result.websiteBuilder.getPageById.data;
    }

    public async listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        const { where, ...rest } = options ?? {};

        const result = await this.config.apiClient.query({
            query: LIST_PUBLISHED_PAGES,
            variables: {
                where: {
                    ...where,
                    published: true
                },
                ...rest
            }
        });

        this.checkForErrors("listPages", result.websiteBuilder.listPages);

        return {
            data: result.websiteBuilder.listPages.data ?? [],
            meta: result.websiteBuilder.listPages.meta ?? {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null
            }
        };
    }

    private checkForErrors(action: string, data: any) {
        if (data.error) {
            // TODO: investigate how these ignored actions make their way to the SDK.
            if (ignoreActions.some(item => action.includes(item))) {
                return;
            }
            console.error(`Could not execute "${action}". Reason: ${data.error.message}`);
        }
    }
}
