import { CmsContentModelManager, CmsContentModel, CmsContext } from "~/types";

export class DefaultContentModelManager implements CmsContentModelManager {
    private readonly _context: CmsContext;
    private readonly _model: CmsContentModel;

    public constructor(context: CmsContext, model: CmsContentModel) {
        this._context = context;
        this._model = model;
    }

    public async create(data) {
        return this._context.cms.entries.createEntry(this._model, data);
    }

    public async delete(id: string) {
        if (id.includes("#")) {
            return this._context.cms.entries.deleteEntryRevision(this._model, id);
        }

        return this._context.cms.entries.deleteEntry(this._model, id);
    }

    public async get(args) {
        return this._context.cms.entries.getEntry(this._model, args);
    }

    public async list(args) {
        return this._context.cms.entries.listEntries(this._model, args);
    }

    public async listPublished(args) {
        return this._context.cms.entries.listPublishedEntries(this._model, args);
    }

    public async listLatest(args) {
        return this._context.cms.entries.listLatestEntries(this._model, args);
    }

    public async getPublishedByIds(ids: string[]) {
        return this._context.cms.entries.getPublishedEntriesByIds(this._model, ids);
    }

    public async getLatestByIds(ids: string[]) {
        return this._context.cms.entries.getLatestEntriesByIds(this._model, ids);
    }

    public async update(id, data) {
        return this._context.cms.entries.updateEntry(this._model, id, data);
    }
}
