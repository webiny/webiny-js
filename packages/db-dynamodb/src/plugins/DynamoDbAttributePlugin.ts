import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { DynamoDbAttributePluginArgs, DynamoDbAttributePluginAttributeParams } from "~/types";
const reservedFields = ["PK", "SK", "index", "data"];

export abstract class DynamoDbAttributePlugin extends Plugin {
    public static readonly type = "db.dynamodb.attribute";
    private readonly _entity: string;
    private readonly _attribute: string;
    private readonly _params: DynamoDbAttributePluginAttributeParams;

    public get entity(): string {
        return this._entity;
    }

    public get attribute(): string {
        return this._attribute;
    }

    public constructor({ entity, attribute, params }: DynamoDbAttributePluginArgs) {
        super();

        this.validateReserved(attribute);

        this._entity = entity;
        this._attribute = attribute;
        this._params = params;
    }

    public getDefinition(): Record<string, DynamoDbAttributePluginAttributeParams> {
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
