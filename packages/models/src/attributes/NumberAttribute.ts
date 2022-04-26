import { Attribute, AttributeParams } from "./Attribute";

export type NumberAttributeParams = Omit<AttributeParams, "type">;
export class NumberAttribute extends Attribute {
    public constructor(params: NumberAttributeParams) {
        super({
            ...params,
            type: "number"
        });
    }
}
