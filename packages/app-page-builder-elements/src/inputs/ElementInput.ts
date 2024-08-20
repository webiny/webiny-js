import { Element } from "~/types";

export interface GetElementInputValue<TValue = unknown> {
    (element: Element<any>): TValue | undefined;
}

export type ElementInputs = Record<string, ElementInput>;

export interface ElementInputParams<TValue> {
    name: string;
    getDefaultValue: GetElementInputValue<TValue>;
    translatable?: boolean;
}

export class ElementInput<TValue = unknown> {
    private params: ElementInputParams<TValue>;

    constructor(params: ElementInputParams<TValue>) {
        this.params = params;
    }

    isTranslatable() {
        return this.params.translatable ?? false;
    }

    getDefaultValue(element: Element): TValue | undefined {
        if (!this.params.getDefaultValue) {
            return this.getValueFromDefaultLocation(element);
        }

        const value = this.params.getDefaultValue(element);
        if (!value) {
            return undefined;
        }

        return value as TValue;
    }

    private getValueFromDefaultLocation(element: Element) {
        return element.data.inputs[this.params.name];
    }
}

export type ElementInputValues<T extends ElementInputs> = {
    [K in keyof T]: T[K] extends ElementInput<infer P> ? P | undefined : never;
};
