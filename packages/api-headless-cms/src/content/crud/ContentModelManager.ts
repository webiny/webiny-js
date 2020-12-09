/* eslint-disable */
import {
    CmsContentModelManagerContextType,
    CmsContentModelManagerListContextArgsType,
    CmsContentModelType,
    CmsContext
} from "@webiny/api-headless-cms/types";

export class ContentModelManager<T> implements CmsContentModelManagerContextType<T> {
    private readonly _context: CmsContext;
    private readonly _model: CmsContentModelType;

    public constructor(context: CmsContext, model: CmsContentModelType) {
        this._context = context;
        this._model = model;
    }

    public async create<TData>(data: TData): Promise<T> {
        return ({} as unknown) as T;
    }

    public async delete(id: string): Promise<boolean> {
        return false;
    }

    public async get(id: string): Promise<T> {
        return ({} as unknown) as T;
    }

    public async list(args?: CmsContentModelManagerListContextArgsType): Promise<T[]> {
        return ([] as unknown) as T[];
    }

    public async update<TData>(data: TData): Promise<T> {
        return ({} as unknown) as T;
    }
}
