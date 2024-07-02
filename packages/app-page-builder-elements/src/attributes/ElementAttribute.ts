import { Element } from "~/types";

export interface GetElementAttributeValue<TValue = unknown> {
    (element: Element<any>): TValue | undefined;
}

export interface ElementAttributeParams<TValue> {
    name: string;
    getValue?: GetElementAttributeValue<TValue>;
}

export class ElementAttribute<TValue = unknown> {
    private params: ElementAttributeParams<TValue>;

    constructor(params: ElementAttributeParams<TValue>) {
        this.params = params;
    }

    getValue(element: Element): TValue | undefined {
        if (!this.params.getValue) {
            return this.getValueFromDefaultLocation(element);
        }

        const value = this.params.getValue(element);
        if (!value) {
            return undefined;
        }

        return value as TValue;
    }

    private getValueFromDefaultLocation(element: Element) {
        return element.data.attributes[this.params.name];
    }
}
