import omit from "lodash/omit.js";
import type { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
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
} from "~/context/pages/pages.types.js";
import { entryFromStorageTransform } from "@webiny/api-headless-cms";
import type { PluginsContainer } from "@webiny/plugins";

type PagesStorageParams = {
    model: CmsModel;
    cms: HeadlessCms;
    plugins: PluginsContainer;
    getTenantId: () => string;
    getLocaleCode: () => string;
};

export class PagesStorage implements WbPagesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly model: CmsModel;
    private readonly plugins: PluginsContainer;
    private getTenantId: () => string;
    private getLocaleCode: () => string;

    static async create(params: PagesStorageParams) {
        return new PagesStorage(params);
    }

    private constructor(params: PagesStorageParams) {
        this.plugins = params.plugins;
        this.model = params.model;
        this.cms = params.cms;
        this.getTenantId = params.getTenantId;
        this.getLocaleCode = params.getLocaleCode;
    }

    public get = async (params: WbPagesStorageOperationsGetParams): Promise<WbPage | null> => {
        const rawEntry = await this.cms.getEntry(this.getModel(), params);

        const entry = await entryFromStorageTransform(
            { plugins: this.plugins },
            this.getModel(),
            rawEntry
        );

        return entry ? this.getWbPageFieldValues(entry) : null;
    };

    public getById = async (id: string): Promise<WbPage | null> => {
        const rawEntry = await this.cms.getEntryById(this.getModel(), id);

        const entry = await entryFromStorageTransform(
            { plugins: this.plugins },
            this.getModel(),
            rawEntry
        );

        return entry ? this.getWbPageFieldValues(entry) : null;
    };

    public getRevisions = async (pageId: string): Promise<WbPage[]> => {
        const revisions = await this.cms.getEntryRevisions(this.getModel(), pageId);
        return revisions.map(entry => this.getWbPageFieldValues(entry));
    };

    public list = async (
        params: WbPagesStorageOperationsListParams
    ): Promise<WbPagesStorageOperationsListResponse> => {
        const [entries, meta] = await this.cms.listEntries(this.getModel(), {
            after: params.after,
            limit: params.limit,
            sort: params.sort,
            where: params.where,
            search: params.search
        });

        return [entries.map(entry => this.getWbPageFieldValues(entry)), meta];
    };

    public create = async ({ data }: WbPagesStorageOperationsCreateParams): Promise<WbPage> => {
        const entry = await this.cms.createEntry(this.getModel(), data);
        return this.getWbPageFieldValues(entry);
    };

    public update = async ({ id, data }: WbPagesStorageOperationsUpdateParams): Promise<WbPage> => {
        const entry = await this.cms.getEntryById(this.getModel(), id);

        const values = omit(data, ["id", "tenant"]);

        const updatedEntry = await this.cms.updateEntry(this.getModel(), entry.id, values);

        return this.getWbPageFieldValues(updatedEntry);
    };

    public publish = async ({ id }: WbPagesStorageOperationsPublishParams): Promise<WbPage> => {
        const entry = await this.cms.publishEntry(this.getModel(), id);
        return this.getWbPageFieldValues(entry);
    };

    public unpublish = async ({ id }: WbPagesStorageOperationsUnpublishParams): Promise<WbPage> => {
        const entry = await this.cms.unpublishEntry(this.getModel(), id);
        return this.getWbPageFieldValues(entry);
    };

    public move = async ({ id, folderId }: WbPagesStorageOperationsMoveParams): Promise<void> => {
        await this.cms.moveEntry(this.getModel(), id, folderId);
    };

    public createRevisionFrom = async ({
        id
    }: WbPagesStorageOperationsCreateRevisionFromParams): Promise<WbPage> => {
        const entry = await this.cms.createEntryRevisionFrom(this.getModel(), id, {});
        return this.getWbPageFieldValues(entry);
    };

    public delete = async ({ id }: WbPagesStorageOperationsDeleteParams): Promise<void> => {
        await this.cms.deleteEntry(this.getModel(), id);
    };

    private getModel() {
        return { ...this.model, tenant: this.getTenantId() };
    }

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
            // TODO figure out if we should make mapper extendable so Pages do not know about states?
            state: entry.state,
            ...entry.values
        } as WbPage;
    }
}
