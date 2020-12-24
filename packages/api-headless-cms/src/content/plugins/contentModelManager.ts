import {
    CmsContentModelManagerInterface,
    CmsContentModelType,
    CmsContext,
    ContentModelManagerPlugin
} from "@webiny/api-headless-cms/types";

class DefaultContentModelManager implements CmsContentModelManagerInterface {
    private readonly _context: CmsContext;
    private readonly _model: CmsContentModelType;

    public constructor(context: CmsContext, model: CmsContentModelType) {
        this._context = context;
        this._model = model;
    }

    public async create(data) {
        return this._context.cms.entries.create(this._model, data);
    }

    public async delete(id: string) {
        return this._context.cms.entries.delete(this._model, id);
    }

    public async get(args) {
        return this._context.cms.entries.get(this._model, args);
    }

    public async list(args, options) {
        return this._context.cms.entries.list(this._model, args, options);
    }

    public async listPublished(args) {
        return this._context.cms.entries.listPublished(this._model, args);
    }

    public async listLatest(args) {
        return this._context.cms.entries.listLatest(this._model, args);
    }

    public async update(id, data) {
        return this._context.cms.entries.update(this._model, id, data);
    }
}
const plugin: ContentModelManagerPlugin = {
    type: "content-model-manager",
    name: "content-model-manager-default",
    create: async (context, model) => {
        return new DefaultContentModelManager(context, model);
    }
};
export default () => plugin;
