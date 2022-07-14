import {
    CmsModelManager,
    CmsModel,
    CmsContext,
    CmsEntryListParams,
    CreateCmsEntryInput,
    UpdateCmsEntryInput
} from "~/types";
import { parseIdentifier } from "@webiny/utils";

export class DefaultCmsModelManager implements CmsModelManager {
    private readonly _context: CmsContext;
    private readonly _model: CmsModel;

    public constructor(context: CmsContext, model: CmsModel) {
        this._context = context;
        this._model = model;
    }

    public async create(data: CreateCmsEntryInput) {
        return this._context.cms.createEntry(this._model, data);
    }

    public async delete(id: string) {
        const { version } = parseIdentifier(id);
        if (version) {
            return this._context.cms.deleteEntryRevision(this._model, id);
        }

        return this._context.cms.deleteEntry(this._model, id);
    }

    public async get(id: string) {
        return this._context.cms.getEntryById(this._model, id);
    }

    public async listPublished(params: CmsEntryListParams) {
        return this._context.cms.listPublishedEntries(this._model, params);
    }

    public async listLatest(params: CmsEntryListParams) {
        return this._context.cms.listLatestEntries(this._model, params);
    }

    public async getPublishedByIds(ids: string[]) {
        return this._context.cms.getPublishedEntriesByIds(this._model, ids);
    }

    public async getLatestByIds(ids: string[]) {
        return this._context.cms.getLatestEntriesByIds(this._model, ids);
    }

    public async update(id: string, data: UpdateCmsEntryInput) {
        return this._context.cms.updateEntry(this._model, id, data);
    }
}
