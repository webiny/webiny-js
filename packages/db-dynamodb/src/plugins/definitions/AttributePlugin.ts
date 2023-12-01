import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { AttributeDefinition } from "~/toolbox";

const reservedFields = ["PK", "SK", "index", "data"];

export interface AttributePluginParams {
    entity: string;
    attribute: string;
    params: AttributeDefinition;
}

export abstract class AttributePlugin extends Plugin {
    public static override readonly type: string = "db.dynamodb.attribute";
    private readonly _entity: string;
    private readonly _attribute: string;
    private readonly _params: AttributeDefinition;

    public get entity(): string {
        return this._entity;
    }

    public get attribute(): string {
        return this._attribute;
    }

    public constructor({ entity, attribute, params }: AttributePluginParams) {
        super();

        this.validateReserved(attribute);

        this._entity = entity;
        this._attribute = attribute;
        this._params = params;
    }

    public getDefinition(): Record<string, AttributeDefinition> {
        return {
            [this.attribute]: this._params
        };
    }

    private validateReserved(attribute: string): void {
        if (reservedFields.includes(attribute) === false) {
            return;
        }
        throw new WebinyError(
            `Attribute name "${attribute}" is not allowed.`,
            "ATTRIBUTE_NOT_ALLOWED",
            {
                attribute
            }
        );
    }
}
