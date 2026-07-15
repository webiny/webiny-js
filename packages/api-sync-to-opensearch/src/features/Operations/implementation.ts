import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IDeleteOperationParams,
    IInsertOperationParams,
    IModifyOperationParams,
    IOperations
} from "./abstraction.js";

export enum OperationType {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

export class OperationsImpl implements IOperations {
    private _items: GenericRecord[] = [];
    private _count = 0;

    public get items(): GenericRecord[] {
        return this._items;
    }

    public get total(): number {
        return this.items.length;
    }

    public get count(): number {
        return this._count;
    }

    public clear() {
        this._items = [];
        this._count = 0;
    }

    public insert(params: IInsertOperationParams): void {
        this._count++;
        this.items.push(
            {
                index: {
                    _id: params.id,
                    _index: params.index
                }
            },
            params.data
        );
    }

    public modify(params: IModifyOperationParams): void {
        this.insert(params);
    }

    public delete(params: IDeleteOperationParams): void {
        this._count++;
        this.items.push({
            delete: {
                _id: params.id,
                _index: params.index
            }
        });
    }
}
