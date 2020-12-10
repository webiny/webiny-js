import {
    CmsContentModelManagerInterface,
    CmsContentModelManagerListArgsType,
    CmsContentModelType,
    CmsContext
} from "@webiny/api-headless-cms/types";

export class ContentModelManager<T> implements CmsContentModelManagerInterface<T> {
    private readonly _context: CmsContext;
    private readonly _model: CmsContentModelType;

    public constructor(context: CmsContext, model: CmsContentModelType) {
        this._context = context;
        this._model = model;
    }

    // eslint-disable-next-line
    public async create<TData>(data: TData): Promise<T> {
        return ({} as unknown) as T;
    }

    // eslint-disable-next-line
    public async delete(id: string): Promise<boolean> {
        return false;
    }

    // eslint-disable-next-line
    public async get(id: string): Promise<T> {
        return ({} as unknown) as T;
    }

    // eslint-disable-next-line
    public async list(args?: CmsContentModelManagerListArgsType): Promise<T[]> {
        return ([] as unknown) as T[];
    }

    // eslint-disable-next-line
    public async update<TData>(data: TData): Promise<T> {
        return ({} as unknown) as T;
    }
}
