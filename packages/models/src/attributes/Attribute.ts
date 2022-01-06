import { Attribute as AttributeInterface } from "~/types";

export type AttributeParams = AttributeInterface;

export class Attribute implements AttributeInterface {
    public readonly name: string;
    public readonly type: string;

    public constructor(params: AttributeParams) {
        this.name = params.name;
        this.type = params.type;
    }
}
