import { AttributeMap, Attributes } from "~/attributes/Attributes";
import { Attribute } from "~/types";

export interface ModelParams {
    name: string;
    attributes?: Attribute[];
}
export class Model {
    public readonly name: string;
    private readonly attributes: Attributes = new Attributes();

    public constructor(params: ModelParams) {
        this.name = params.name;
        this.addAttributes(params.attributes || []);
    }

    public getAttributes(): AttributeMap {
        return this.attributes.getAttributes();
    }
    /**
     * @see addAttribute
     */
    public addAttributes(attributes: Attribute[]): void {
        for (const attr of attributes) {
            this.addAttribute(attr);
        }
    }
    /**
     * We allow passing both Attribute interface and Attribute interface implementation.
     * This way users will not need to know about Attribute interface implementation or they can create their own.
     */
    public addAttribute(attr: Attribute): void {
        this.attributes.addAttributes([attr]);
    }

    public removeAttribute(attr: Attribute | string): void {
        this.attributes.removeAttribute(attr);
    }

    public getAttribute(name: string): Attribute | null {
        return this.attributes.getAttribute(name);
    }
}
