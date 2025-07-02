import omit from "lodash/omit";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type {
    WbPage,
    WbPagesStorageOperations,
    WbPagesStorageOperationsCreateParams,
    WbPagesStorageOperationsDeleteParams,
    WbPagesStorageOperationsGetParams,
    WbPagesStorageOperationsListParams,
    WbPagesStorageOperationsListResponse,
    WbPagesStorageOperationsUpdateParams
} from "~/page/page.types";

export class CmsPagesStorage implements WbPagesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly model: CmsModel;

    static async create(params: { pageModel: CmsModel; cms: HeadlessCms }) {
        return new CmsPagesStorage(params.pageModel, params.cms);
    }

    private constructor(pageModel: CmsModel, cms: HeadlessCms) {
        this.model = pageModel;
        this.cms = cms;
    }

    public get = async (params: WbPagesStorageOperationsGetParams): Promise<WbPage | null> => {
        const { id } = params;
        const entry = await this.cms.getEntry(this.model, { where: { entryId: id, latest: true } });
        return entry ? this.getWbPageFieldValues(entry) : null;
    };

    public list = async (
        params: WbPagesStorageOperationsListParams
    ): Promise<WbPagesStorageOperationsListResponse> => {
        const [entries, meta] = await this.cms.listLatestEntries(this.model, {
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
        const entry = await this.cms.getEntry(this.model, {
            where: { entryId: id, latest: true }
        });

        const values = omit(data, ["id", "tenant", "locale", "webinyVersion"]);

        const updatedEntry = await this.cms.updateEntry(this.model, entry.id, values);

        return this.getWbPageFieldValues(updatedEntry);
    };

    public delete = async ({ id }: WbPagesStorageOperationsDeleteParams): Promise<void> => {
        await this.cms.deleteEntry(this.model, id);
    };

    private getWbPageFieldValues(entry: CmsEntry) {
        return {
            id: entry.id,
            entryId: entry.entryId,
            wbyAco_location: entry.location,
            tenant: entry.tenant,
            locale: entry.locale,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as WbPage;
    }
}
