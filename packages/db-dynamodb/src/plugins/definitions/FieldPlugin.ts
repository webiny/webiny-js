import { Plugin } from "@webiny/plugins";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";

export interface Params {
    /**
     * Default is string.
     */
    type?: DynamoDBTypes;
    name: string;
    path: string;
    /**
     * Default is true.
     */
    sortable?: boolean;
}

export abstract class FieldPlugin extends Plugin {
    private readonly path: string;
    private readonly name: string;
    private readonly fieldType: DynamoDBTypes;
    private readonly sortable: boolean;

    public constructor(params: Params) {
        super();
        this.fieldType = params.type || "string";
        this.name = params.name;
        this.path = params.path;
        this.sortable = params.sortable === undefined ? true : params.sortable;
    }

    public getPath(): string {
        return this.path || this.name;
    }

    public getType(): DynamoDBTypes {
        return this.fieldType;
    }

    public getName(): string {
        return this.name;
    }

    public transformValue<T = any, R = any>(value: T): R {
        return value;
    }

    public isSortable(): boolean {
        return this.sortable;
    }
}
