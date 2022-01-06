import { Attribute, AttributeParams } from "./Attribute";

export type StringAttributeParams = Omit<AttributeParams, "type">;
export class StringAttribute extends Attribute {
    public constructor(params: StringAttributeParams) {
        super({
            ...params,
            type: "string"
        });
    }
}
