import type { ReactElement } from "react";

export interface NodeParams<TData = unknown> {
    id: string;
    text: string;
    parentId: string;
    droppable?: boolean;
    data?: TData;
    icon?: ReactElement;
}

export class Node<TData = unknown> {
    private readonly _id: string;
    private readonly _text: string;
    private readonly _parentId: string;
    private readonly _droppable: boolean;
    private readonly _data: TData;
    private readonly _icon?: ReactElement;

    protected constructor(params: NodeParams<TData>) {
        this._id = params.id;
        this._text = params.text;
        this._parentId = params.parentId;
        this._droppable = params.droppable ?? true;
        this._data = params.data as TData;
        this._icon = params.icon;
    }

    static create<TData = unknown>(data: NodeParams<TData>): Node<TData> {
        return new Node<TData>(data);
    }

    get id() {
        return this._id;
    }

    get text() {
        return this._text;
    }

    get parentId() {
        return this._parentId;
    }

    get droppable() {
        return this._droppable;
    }

    get data(): TData {
        return this._data;
    }

    get icon(): ReactElement | undefined {
        return this._icon;
    }
}
