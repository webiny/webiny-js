import { Attribute, AttributeParams } from "./Attribute";

export type BooleanAttributeParams = Omit<AttributeParams, "type">;
export class BooleanAttribute extends Attribute {
    public constructor(params: BooleanAttributeParams) {
        super({
            ...params,
            type: "boolean"
        });
    }
}
