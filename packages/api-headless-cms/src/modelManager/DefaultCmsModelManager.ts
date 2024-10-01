import {
    CmsModelManager,
    CmsModel,
    CmsContext,
    CmsEntryListParams,
    CreateCmsEntryInput,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput,
    CreateCmsEntryOptionsInput
} from "~/types";
import { parseIdentifier } from "@webiny/utils";

export class DefaultCmsModelManager implements CmsModelManager {
    private readonly _context: CmsContext;
    public readonly model: CmsModel;

    public constructor(context: CmsContext, model: CmsModel) {
        this._context = context;
        this.model = model;
    }

    public async create(data: CreateCmsEntryInput, options?: CreateCmsEntryOptionsInput) {
        return this._context.cms.createEntry(this.model, data, options);
    }

    public async delete(id: string) {
        const { version } = parseIdentifier(id);
        if (version) {
            return this._context.cms.deleteEntryRevision(this.model, id);
        }

        return this._context.cms.deleteEntry(this.model, id);
    }

    public async get(id: string) {
        return this._context.cms.getEntryById(this.model, id);
    }

    public async listPublished(params: CmsEntryListParams) {
        return this._context.cms.listPublishedEntries(this.model, params);
    }

    public async listLatest(params: CmsEntryListParams) {
        return this._context.cms.listLatestEntries(this.model, params);
    }

    public async listDeleted(params: CmsEntryListParams) {
        return this._context.cms.listDeletedEntries(this.model, params);
    }

    public async getPublishedByIds(ids: string[]) {
        return this._context.cms.getPublishedEntriesByIds(this.model, ids);
    }

    public async getLatestByIds(ids: string[]) {
        return this._context.cms.getLatestEntriesByIds(this.model, ids);
    }

    public async update(
        id: string,
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ) {
        return this._context.cms.updateEntry(this.model, id, data, options);
    }
}
