import { CmsContentModelManager, CmsContentModel, CmsContext } from "../../../types";

export class DefaultContentModelManager implements CmsContentModelManager {
    private readonly _context: CmsContext;
    private readonly _model: CmsContentModel;

    public constructor(context: CmsContext, model: CmsContentModel) {
        this._context = context;
        this._model = model;
    }

    public async create(data) {
        return this._context.cms.entries.create(this._model, data);
    }

    public async delete(id: string) {
        if (id.includes("#")) {
            return this._context.cms.entries.deleteRevision(this._model, id);
        }

        return this._context.cms.entries.deleteEntry(this._model, id);
    }

    public async get(args) {
        return this._context.cms.entries.get(this._model, args);
    }

    public async list(args) {
        return this._context.cms.entries.list(this._model, args);
    }

    public async listPublished(args) {
        return this._context.cms.entries.listPublished(this._model, args);
    }

    public async listLatest(args) {
        return this._context.cms.entries.listLatest(this._model, args);
    }

    public async getPublishedByIds(ids: string[]) {
        return this._context.cms.entries.getPublishedByIds(this._model, ids);
    }

    public async getLatestByIds(ids: string[]) {
        return this._context.cms.entries.getLatestByIds(this._model, ids);
    }

    public async update(id, data) {
        return this._context.cms.entries.update(this._model, id, data);
    }
}
