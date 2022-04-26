import { Attribute, AttributeParams } from "./Attribute";

export type ObjectAttributeParams = Omit<AttributeParams, "type">;
export class ObjectAttribute extends Attribute {
    public constructor(params: ObjectAttributeParams) {
        super({
            ...params,
            type: "object"
        });
    }
}
