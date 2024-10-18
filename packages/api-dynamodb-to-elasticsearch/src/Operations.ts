import { GenericRecord } from "@webiny/cli/types";
import {
    IDeleteOperationParams,
    IInsertOperationParams,
    IModifyOperationParams,
    IOperations
} from "~/types";

export enum OperationType {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

export class Operations implements IOperations {
    public readonly items: GenericRecord[] = [];

    public get total(): number {
        return this.items.length;
    }

    public insert(params: IInsertOperationParams): void {
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
        this.items.push({
            delete: {
                _id: params.id,
                _index: params.index
            }
        });
    }
}
