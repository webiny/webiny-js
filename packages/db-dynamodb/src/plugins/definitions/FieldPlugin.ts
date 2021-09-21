import { Plugin } from "@webiny/plugins";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";

export type FieldType = DynamoDBTypes & "date" & any;

export interface Params {
    /**
     * Default is string.
     */
    type?: FieldType;
    field: string;
    path?: string;
    /**
     * Default is true.
     */
    sortable?: boolean;
}

export abstract class FieldPlugin extends Plugin {
    private readonly path: string;
    private readonly field: string;
    private readonly fieldType: FieldType;
    private readonly dynamoDbType: DynamoDBTypes;
    private readonly sortable: boolean;

    public constructor(params: Params) {
        super();
        this.fieldType = params.type || "string";
        this.dynamoDbType = params.type === "date" ? "string" : params.type;
        this.field = params.field;
        this.path = params.path;
        this.sortable = params.sortable === undefined ? true : params.sortable;
    }

    public getPath(): string {
        return this.path || this.field;
    }

    public getType(): FieldType {
        return this.fieldType;
    }

    public getField(): string {
        return this.field;
    }

    public transformValue(value: any): any {
        switch (this.fieldType) {
            case "number":
                return Number(value);
            case "date":
                return new Date(value);
        }
        return value;
    }

    public isSortable(): boolean {
        return this.sortable;
    }
}
