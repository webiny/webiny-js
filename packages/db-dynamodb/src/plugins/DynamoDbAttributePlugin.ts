import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { DynamoDbAttributePluginParams } from "~/types";
const reservedFields = ["PK", "SK", "index", "data"];

export class DynamoDbAttributePlugin extends Plugin {
    public static type: "db.dynamodb.attribute";
    private readonly _entity: string;
    private readonly _attribute: string;
    private readonly _params: DynamoDbAttributePluginParams;

    public get entity(): string {
        return this._entity;
    }

    public get attribute(): string {
        return this._attribute;
    }
    /**
     *
     * @param entity Defines which entity is this attribute for.
     * @param attribute Name of the attribute.
     * @param params Definition params for the attribute.
     */
    public constructor(entity: string, attribute: string, params: DynamoDbAttributePluginParams) {
        super();
        if (reservedFields.includes(attribute)) {
            throw new WebinyError(
                `Attribute name "${attribute}" is not allowed.`,
                "ATTRIBUTE_NOT_ALLOWED",
                {
                    attribute,
                    params
                }
            );
        }

        this._entity = entity;
        this._attribute = attribute;
        this._params = params;
    }

    public getDefinition(): Record<string, DynamoDbAttributePluginParams> {
        return {
            [this.attribute]: this._params
        };
    }
}
