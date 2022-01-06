import { Attribute, AttributeParams } from "./Attribute";

export type ListAttributeParams = Omit<AttributeParams, "type">;
export class ListAttribute extends Attribute {
    public constructor(params: ListAttributeParams) {
        super({
            ...params,
            type: "list"
        });
    }
}
