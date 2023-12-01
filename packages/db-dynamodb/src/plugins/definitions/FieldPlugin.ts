import { Plugin } from "@webiny/plugins";
import { DynamoDBTypes } from "~/toolbox";

export type FieldType = DynamoDBTypes & "date" & any;

export interface TransformValueCb {
    (value: any): any;
}

export interface FieldPluginParams {
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

    transformValue?: TransformValueCb;
}

export abstract class FieldPlugin extends Plugin {
    private readonly path?: string;
    private readonly field: string;
    private readonly fieldType: FieldType;
    private readonly dynamoDbType: DynamoDBTypes;
    private readonly sortable: boolean;
    private readonly _transformValue: TransformValueCb | undefined;

    public constructor(params: FieldPluginParams) {
        super();
        this.fieldType = params.type || "string";
        this.dynamoDbType = params.type === "date" ? "string" : params.type;
        this.field = params.field;
        this.path = params.path;
        this.sortable = params.sortable === undefined ? true : params.sortable;
        this._transformValue = params.transformValue;
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

    public getDynamoDbType(): string {
        return this.dynamoDbType;
    }

    public transformValue(value: any): any {
        if (this._transformValue) {
            return this.transformValue(value);
        }
        switch (this.fieldType) {
            case "number":
                return Number(value);
            case "date":
                if (!value) {
                    return null;
                }
                return new Date(value);
        }
        return value;
    }

    public isSortable(): boolean {
        return this.sortable;
    }
}
