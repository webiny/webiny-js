import type { WebinyConfig } from "./types.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "./errors.js";
import type { Result } from "./Result.js";
import type {
    WbGlobalComponent,
    WbPage,
    WbPageRevision
} from "./methods/websiteBuilder/websiteBuilderTypes.js";
import type { GetPageByIdParams } from "./methods/websiteBuilder/getPageById.js";
import type { GetPageByPathParams } from "./methods/websiteBuilder/getPageByPath.js";
import type { GetPageRevisionsParams } from "./methods/websiteBuilder/getPageRevisions.js";
import type { ListPagesParams, ListPagesResult } from "./methods/websiteBuilder/listPages.js";
import type { CreatePageParams } from "./methods/websiteBuilder/createPage.js";
import type { UpdatePageParams } from "./methods/websiteBuilder/updatePage.js";
import type { PublishPageParams } from "./methods/websiteBuilder/publishPage.js";
import type { UnpublishPageParams } from "./methods/websiteBuilder/unpublishPage.js";
import type { CreatePageRevisionFromParams } from "./methods/websiteBuilder/createPageRevisionFrom.js";
import type { DeletePageParams } from "./methods/websiteBuilder/deletePage.js";
import type { GetGlobalComponentParams } from "./methods/websiteBuilder/getGlobalComponent.js";
import type { ListGlobalComponentsParams } from "./methods/websiteBuilder/listGlobalComponents.js";
import type { SaveGlobalComponentParams } from "./methods/websiteBuilder/saveGlobalComponent.js";
import { getPageById as getPageByIdFn } from "./methods/websiteBuilder/getPageById.js";
import { getPageByPath as getPageByPathFn } from "./methods/websiteBuilder/getPageByPath.js";
import { getPageRevisions as getPageRevisionsFn } from "./methods/websiteBuilder/getPageRevisions.js";
import { listPages as listPagesFn } from "./methods/websiteBuilder/listPages.js";
import { createPage as createPageFn } from "./methods/websiteBuilder/createPage.js";
import { updatePage as updatePageFn } from "./methods/websiteBuilder/updatePage.js";
import { publishPage as publishPageFn } from "./methods/websiteBuilder/publishPage.js";
import { unpublishPage as unpublishPageFn } from "./methods/websiteBuilder/unpublishPage.js";
import { createPageRevisionFrom as createPageRevisionFromFn } from "./methods/websiteBuilder/createPageRevisionFrom.js";
import { deletePage as deletePageFn } from "./methods/websiteBuilder/deletePage.js";
import { getGlobalComponent as getGlobalComponentFn } from "./methods/websiteBuilder/getGlobalComponent.js";
import { listGlobalComponents as listGlobalComponentsFn } from "./methods/websiteBuilder/listGlobalComponents.js";
import { saveGlobalComponent as saveGlobalComponentFn } from "./methods/websiteBuilder/saveGlobalComponent.js";

type WbError = HttpError | ApiError | NetworkError | ValidationError;

/**
 * Website Builder: pages and global components. Read the published site for rendering with
 * `@webiny/website-builder-sdk`; this module is for managing content (editorial tools, imports,
 * publishing).
 */
export class WebsiteBuilderSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getPageById(params: GetPageByIdParams): Promise<Result<WbPage, WbError>> {
        return getPageByIdFn(this.config, this.fetchFn, params);
    }

    async getPageByPath(params: GetPageByPathParams): Promise<Result<WbPage, WbError>> {
        return getPageByPathFn(this.config, this.fetchFn, params);
    }

    async getPageRevisions(
        params: GetPageRevisionsParams
    ): Promise<Result<WbPageRevision[], WbError>> {
        return getPageRevisionsFn(this.config, this.fetchFn, params);
    }

    async listPages(params: ListPagesParams): Promise<Result<ListPagesResult, WbError>> {
        return listPagesFn(this.config, this.fetchFn, params);
    }

    async createPage(params: CreatePageParams): Promise<Result<WbPage, WbError>> {
        return createPageFn(this.config, this.fetchFn, params);
    }

    async updatePage(params: UpdatePageParams): Promise<Result<WbPage, WbError>> {
        return updatePageFn(this.config, this.fetchFn, params);
    }

    async publishPage(params: PublishPageParams): Promise<Result<WbPage, WbError>> {
        return publishPageFn(this.config, this.fetchFn, params);
    }

    async unpublishPage(params: UnpublishPageParams): Promise<Result<WbPage, WbError>> {
        return unpublishPageFn(this.config, this.fetchFn, params);
    }

    async createPageRevisionFrom(
        params: CreatePageRevisionFromParams
    ): Promise<Result<WbPage, WbError>> {
        return createPageRevisionFromFn(this.config, this.fetchFn, params);
    }

    async deletePage(params: DeletePageParams): Promise<Result<boolean, WbError>> {
        return deletePageFn(this.config, this.fetchFn, params);
    }

    async getGlobalComponent(
        params: GetGlobalComponentParams
    ): Promise<Result<WbGlobalComponent | null, WbError>> {
        return getGlobalComponentFn(this.config, this.fetchFn, params);
    }

    async listGlobalComponents(
        params: ListGlobalComponentsParams = {}
    ): Promise<Result<WbGlobalComponent[], WbError>> {
        return listGlobalComponentsFn(this.config, this.fetchFn, params);
    }

    async saveGlobalComponent(
        params: SaveGlobalComponentParams
    ): Promise<Result<WbGlobalComponent, WbError>> {
        return saveGlobalComponentFn(this.config, this.fetchFn, params);
    }
}
