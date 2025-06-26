export interface NodeParams<TData = Record<string, any>> {
    id: string;
    parentId: string;
    droppable?: boolean;
    active?: boolean;
    loading?: boolean;
    label: string;
    data?: TData;
}

export class Node<TData = Record<string, any>> {
    private readonly _id: string;
    private readonly _parentId: string;
    private readonly _droppable: boolean;
    private readonly _active: boolean;
    private readonly _loading: boolean;
    private readonly _label: string;
    private readonly _data: TData;

    protected constructor(params: NodeParams<TData>) {
        this._id = params.id;
        this._parentId = params.parentId;
        this._droppable = params.droppable ?? true;
        this._active = params.active ?? false;
        this._loading = params.loading ?? false;
        this._label = params.label;
        this._data = params.data as TData;
    }

    static create<TData = Record<string, any>>(data: NodeParams<TData>): Node<TData> {
        return new Node<TData>(data);
    }

    get id() {
        return this._id;
    }

    get label() {
        return this._label;
    }

    get parentId() {
        return this._parentId;
    }

    get droppable() {
        return this._droppable;
    }

    get active() {
        return this._active;
    }

    get loading() {
        return this._loading;
    }

    get data(): TData {
        return this._data;
    }
}
