import { CmsModelManager, CmsModel, CmsContext } from "~/types";

export class DefaultContentModelManager implements CmsModelManager {
    private readonly _context: CmsContext;
    private readonly _model: CmsModel;

    public constructor(context: CmsContext, model: CmsModel) {
        this._context = context;
        this._model = model;
    }

    public async create(data) {
        return this._context.cms.createEntry(this._model, data);
    }

    public async delete(id: string) {
        if (id.includes("#")) {
            return this._context.cms.deleteEntryRevision(this._model, id);
        }

        return this._context.cms.deleteEntry(this._model, id);
    }

    public async get(args) {
        return this._context.cms.getEntry(this._model, args);
    }

    public async list(args) {
        return this._context.cms.listEntries(this._model, args);
    }

    public async listPublished(args) {
        return this._context.cms.listPublishedEntries(this._model, args);
    }

    public async listLatest(args) {
        return this._context.cms.listLatestEntries(this._model, args);
    }

    public async getPublishedByIds(ids: string[]) {
        return this._context.cms.getPublishedEntriesByIds(this._model, ids);
    }

    public async getLatestByIds(ids: string[]) {
        return this._context.cms.getLatestEntriesByIds(this._model, ids);
    }

    public async update(id, data) {
        return this._context.cms.updateEntry(this._model, id, data);
    }
}
