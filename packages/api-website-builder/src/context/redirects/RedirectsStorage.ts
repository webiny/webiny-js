import omit from "lodash/omit";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import {
    WbRedirect,
    WbRedirectsStorageOperations,
    WbRedirectsStorageOperationsCreateParams,
    WbRedirectsStorageOperationsDeleteParams,
    WbRedirectsStorageOperationsListParams,
    WbRedirectsStorageOperationsListResponse,
    WbRedirectsStorageOperationsMoveParams,
    WbRedirectsStorageOperationsUpdateParams
} from "~/context/redirects/redirects.types";
import { entryFromStorageTransform } from "@webiny/api-headless-cms";
import type { PluginsContainer } from "@webiny/plugins";

export class RedirectsStorage implements WbRedirectsStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly model: CmsModel;
    private readonly plugins: PluginsContainer;

    static async create(params: { model: CmsModel; cms: HeadlessCms; plugins: PluginsContainer }) {
        return new RedirectsStorage(params.model, params.cms, params.plugins);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, plugins: PluginsContainer) {
        this.plugins = plugins;
        this.model = model;
        this.cms = cms;
    }

    public getById = async (id: string): Promise<WbRedirect | null> => {
        const rawEntry = await this.cms.getEntryById(this.model, id + "#0001");

        const entry = await entryFromStorageTransform(
            { plugins: this.plugins },
            this.model,
            rawEntry
        );

        return entry ? this.getWbRedirectFieldValues(entry) : null;
    };

    public list = async (
        params: WbRedirectsStorageOperationsListParams
    ): Promise<WbRedirectsStorageOperationsListResponse> => {
        const [entries, meta] = await this.cms.listEntries(this.model, {
            after: params.after,
            limit: params.limit,
            sort: params.sort,
            where: { ...params.where, latest: true },
            search: params.search
        });

        return [entries.map(entry => this.getWbRedirectFieldValues(entry)), meta];
    };

    public create = async ({
        data
    }: WbRedirectsStorageOperationsCreateParams): Promise<WbRedirect> => {
        const entry = await this.cms.createEntry(this.model, data);
        return this.getWbRedirectFieldValues(entry);
    };

    public update = async ({
        id,
        data
    }: WbRedirectsStorageOperationsUpdateParams): Promise<WbRedirect> => {
        const entry = await this.cms.getEntryById(this.model, id + "#0001");

        const values = omit(data, ["id", "tenant", "locale", "webinyVersion"]);

        const updatedEntry = await this.cms.updateEntry(this.model, entry.id, values);

        return this.getWbRedirectFieldValues(updatedEntry);
    };

    public move = async ({
        id,
        folderId
    }: WbRedirectsStorageOperationsMoveParams): Promise<void> => {
        await this.cms.moveEntry(this.model, id, folderId);
    };

    public delete = async ({ id }: WbRedirectsStorageOperationsDeleteParams): Promise<void> => {
        await this.cms.deleteEntry(this.model, id);
    };

    private getWbRedirectFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            wbyAco_location: entry.location,
            status: entry.status,
            version: entry.version,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            modifiedOn: entry.modifiedOn,
            modifiedBy: entry.modifiedBy,
            tenant: entry.tenant,
            locale: entry.locale,
            redirectFrom: entry.values.redirectFrom,
            redirectTo: entry.values.redirectTo,
            redirectType: entry.values.redirectType,
            isEnabled: entry.values.isEnabled
        } as WbRedirect;
    }
}
