import type { GenericRecord } from "@webiny/api/types.js";
import { Operations as OperationsAbstraction } from "./abstractions/Operations.js";

export enum OperationType {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

export class OperationsImpl implements OperationsAbstraction.Interface {
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

    public insert(params: OperationsAbstraction.InsertParams): void {
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

    public modify(params: OperationsAbstraction.ModifyParams): void {
        this.insert(params);
    }

    public delete(params: OperationsAbstraction.DeleteParams): void {
        this._count++;
        this.items.push({
            delete: {
                _id: params.id,
                _index: params.index
            }
        });
    }
}
