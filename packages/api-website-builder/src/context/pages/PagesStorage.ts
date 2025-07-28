import omit from "lodash/omit";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type {
    WbPage,
    WbPagesStorageOperations,
    WbPagesStorageOperationsCreateParams,
    WbPagesStorageOperationsCreateRevisionFromParams,
    WbPagesStorageOperationsDeleteParams,
    WbPagesStorageOperationsGetParams,
    WbPagesStorageOperationsListParams,
    WbPagesStorageOperationsListResponse,
    WbPagesStorageOperationsMoveParams,
    WbPagesStorageOperationsPublishParams,
    WbPagesStorageOperationsUnpublishParams,
    WbPagesStorageOperationsUpdateParams
} from "~/context/pages/pages.types";
import { entryFromStorageTransform } from "@webiny/api-headless-cms";
import type { PluginsContainer } from "@webiny/plugins";

export class PagesStorage implements WbPagesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly model: CmsModel;
    private readonly plugins: PluginsContainer;

    static async create(params: { model: CmsModel; cms: HeadlessCms; plugins: PluginsContainer }) {
        return new PagesStorage(params.model, params.cms, params.plugins);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, plugins: PluginsContainer) {
        this.plugins = plugins;
        this.model = model;
        this.cms = cms;
    }

    public get = async (params: WbPagesStorageOperationsGetParams): Promise<WbPage | null> => {
        const rawEntry = await this.cms.getEntry(this.model, params);

        const entry = await entryFromStorageTransform(
            { plugins: this.plugins },
            this.model,
            rawEntry
        );

        return entry ? this.getWbPageFieldValues(entry) : null;
    };

    public getById = async (id: string): Promise<WbPage | null> => {
        const rawEntry = await this.cms.getEntryById(this.model, id);

        const entry = await entryFromStorageTransform(
            { plugins: this.plugins },
            this.model,
            rawEntry
        );

        return entry ? this.getWbPageFieldValues(entry) : null;
    };

    public getRevisions = async (pageId: string): Promise<WbPage[]> => {
        const revisions = await this.cms.getEntryRevisions(this.model, pageId);
        return revisions.map(entry => this.getWbPageFieldValues(entry));
    };

    public list = async (
        params: WbPagesStorageOperationsListParams
    ): Promise<WbPagesStorageOperationsListResponse> => {
        const [entries, meta] = await this.cms.listEntries(this.model, {
            after: params.after,
            limit: params.limit,
            sort: params.sort,
            where: params.where,
            search: params.search
        });

        return [entries.map(entry => this.getWbPageFieldValues(entry)), meta];
    };

    public create = async ({ data }: WbPagesStorageOperationsCreateParams): Promise<WbPage> => {
        const entry = await this.cms.createEntry(this.model, data);
        return this.getWbPageFieldValues(entry);
    };

    public update = async ({ id, data }: WbPagesStorageOperationsUpdateParams): Promise<WbPage> => {
        const entry = await this.cms.getEntryById(this.model, id);

        const values = omit(data, ["id", "tenant", "locale", "webinyVersion"]);

        const updatedEntry = await this.cms.updateEntry(this.model, entry.id, values);

        return this.getWbPageFieldValues(updatedEntry);
    };

    public publish = async ({ id }: WbPagesStorageOperationsPublishParams): Promise<WbPage> => {
        const entry = await this.cms.publishEntry(this.model, id);
        return this.getWbPageFieldValues(entry);
    };

    public unpublish = async ({ id }: WbPagesStorageOperationsUnpublishParams): Promise<WbPage> => {
        const entry = await this.cms.unpublishEntry(this.model, id);
        return this.getWbPageFieldValues(entry);
    };

    public move = async ({ id, folderId }: WbPagesStorageOperationsMoveParams): Promise<void> => {
        await this.cms.moveEntry(this.model, id, folderId);
    };

    public createRevisionFrom = async ({
        id
    }: WbPagesStorageOperationsCreateRevisionFromParams): Promise<WbPage> => {
        const entry = await this.cms.createEntryRevisionFrom(this.model, id, {});
        return this.getWbPageFieldValues(entry);
    };

    public delete = async ({ id }: WbPagesStorageOperationsDeleteParams): Promise<void> => {
        await this.cms.deleteEntry(this.model, id);
    };

    private getWbPageFieldValues(entry: CmsEntry) {
        return {
            id: entry.id,
            entryId: entry.entryId,
            wbyAco_location: entry.location,
            status: entry.status,
            version: entry.version,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            modifiedOn: entry.modifiedOn,
            modifiedBy: entry.modifiedBy,
            locked: entry.locked,
            tenant: entry.tenant,
            locale: entry.locale,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as WbPage;
    }
}
