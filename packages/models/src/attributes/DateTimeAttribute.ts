import { Attribute, AttributeParams } from "./Attribute";

export type DateTimeAttributeParams = Omit<AttributeParams, "type">;
export class DateTimeAttribute extends Attribute {
    public constructor(params: DateTimeAttributeParams) {
        super({
            ...params,
            type: "datetime"
        });
    }
}
