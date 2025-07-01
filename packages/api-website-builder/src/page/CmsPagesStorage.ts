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
import { ROOT_FOLDER } from "~/constants";

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

    async create({ data }: WbPagesStorageOperationsCreateParams): Promise<WbPage> {
        if (!data.location?.folderId) {
            data.location = {
                ...data.location,
                folderId: ROOT_FOLDER
            };
        }

        const entry = await this.cms.createEntry(this.model, {
            ...data,
            wbyAco_location: data.location
        });

        return this.getWbPageFieldValues(entry);
    }

    async delete({ id }: WbPagesStorageOperationsDeleteParams): Promise<void> {
        await this.cms.deleteEntry(this.model, id);
    }

    async get(params: WbPagesStorageOperationsGetParams): Promise<WbPage | null> {
        const { id } = params;
        const entry = await this.cms.getEntry(this.model, { where: { entryId: id, latest: true } });
        return entry ? this.getWbPageFieldValues(entry) : null;
    }

    async list(
        params: WbPagesStorageOperationsListParams
    ): Promise<WbPagesStorageOperationsListResponse> {
        const [entries, meta] = await this.cms.listLatestEntries(this.model, {
            after: params.after,
            limit: params.limit,
            sort: params.sort,
            where: params.where,
            search: params.search
        });

        return [entries.map(entry => this.getWbPageFieldValues(entry)), meta];
    }

    async update({ id, data }: WbPagesStorageOperationsUpdateParams): Promise<WbPage> {
        const entry = await this.cms.getEntry(this.model, {
            where: { entryId: id, latest: true }
        });

        const values = omit(data, ["id", "tenant", "locale", "webinyVersion"]);

        const updatedEntry = await this.cms.updateEntry(this.model, entry.id, {
            ...values,
            wbyAco_location: values.location ?? entry.location
        });

        return this.getWbPageFieldValues(updatedEntry);
    }

    private getWbPageFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            ...entry.values
        } as WbPage;
    }
}
