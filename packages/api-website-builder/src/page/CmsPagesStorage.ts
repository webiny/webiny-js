import omit from "lodash/omit";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import {
    type WebsiteBuilderPagesStorageOperations,
    type WebsiteBuilderPagesStorageOperationsCreateParams,
    type WebsiteBuilderPagesStorageOperationsDeleteParams,
    type WebsiteBuilderPagesStorageOperationsGetParams,
    type WebsiteBuilderPagesStorageOperationsListParams,
    type WebsiteBuilderPagesStorageOperationsListResponse,
    type WebsiteBuilderPagesStorageOperationsUpdateParams,
    type WbPage
} from "~/types";
import { ROOT_FOLDER } from "~/constants";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsPagesStorage implements WebsiteBuilderPagesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly model: CmsModel;

    static async create(params: { pageModel: CmsModel; cms: HeadlessCms }) {
        return new CmsPagesStorage(params.pageModel, params.cms);
    }

    private constructor(pageModel: CmsModel, cms: HeadlessCms) {
        this.model = pageModel;
        this.cms = cms;
    }

    async create({ page }: WebsiteBuilderPagesStorageOperationsCreateParams): Promise<WbPage> {
        const model = this.modelWithContext(page);

        if (!page.location?.folderId) {
            page.location = {
                ...page.location,
                folderId: ROOT_FOLDER
            };
        }

        const entry = await this.cms.createEntry(model, {
            ...page,
            wbyAco_location: page.location
        });

        return this.getWbPageFieldValues(entry);
    }

    async delete({ page }: WebsiteBuilderPagesStorageOperationsDeleteParams): Promise<void> {
        const model = this.modelWithContext(page);
        await this.cms.deleteEntry(model, page.id);
    }

    async get({ where }: WebsiteBuilderPagesStorageOperationsGetParams): Promise<WbPage | null> {
        const { id, tenant, locale } = where;
        const model = this.modelWithContext({ tenant, locale });
        const entry = await this.cms.getEntry(model, { where: { entryId: id, latest: true } });
        return entry ? this.getWbPageFieldValues(entry) : null;
    }

    async list(
        params: WebsiteBuilderPagesStorageOperationsListParams
    ): Promise<WebsiteBuilderPagesStorageOperationsListResponse> {
        const tenant = params.where.tenant;
        const locale = params.where.locale;

        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.cms.listLatestEntries(model, {
            after: params.after,
            limit: params.limit,
            sort: params.sort,
            where: params.where,
            search: params.search
        });

        return [entries.map(entry => this.getWbPageFieldValues(entry)), meta];
    }

    async update({ page }: WebsiteBuilderPagesStorageOperationsUpdateParams): Promise<WbPage> {
        const model = this.modelWithContext(page);

        const entry = await this.cms.getEntry(model, {
            where: { entryId: page.id, latest: true }
        });

        const values = omit(page, ["id", "tenant", "locale", "webinyVersion"]);

        const updatedEntry = await this.cms.updateEntry(model, entry.id, {
            ...values,
            wbyAco_location: values.location ?? entry.location
        });

        return this.getWbPageFieldValues(updatedEntry);
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    private getWbPageFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,

            // We're safe to use entry-level meta fields because we don't use revisions with pages.
            createdBy: entry.createdBy,
            modifiedBy: entry.modifiedBy || null,
            savedBy: entry.savedBy,
            createdOn: entry.createdOn,
            modifiedOn: entry.modifiedOn || null,
            savedOn: entry.savedOn,

            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as WbPage;
    }
}
