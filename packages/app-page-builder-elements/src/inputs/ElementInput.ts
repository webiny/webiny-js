import { Element } from "~/types";

export interface GetElementInputValueParams<TElementData> {
    element: Element<TElementData>;
}

export interface GetElementInputValue<TValue = unknown, TElementData = any> {
    (element: GetElementInputValueParams<TElementData>): TValue | undefined;
}

export type ElementInputs = Record<string, ElementInput>;

export type ElementInputType =
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "richText"
    | "link"
    | "svgIcon"
    | "color"
    // We want to allow custom strings as well.
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {});

export interface ElementInputParams<TValue, TElementData> {
    name: string;
    type: ElementInputType;
    getDefaultValue: GetElementInputValue<TValue, TElementData>;
    translatable?: boolean;
}

export class ElementInput<TValue = unknown, TElementData = any> {
    private params: ElementInputParams<TValue, TElementData>;

    private constructor(params: ElementInputParams<TValue, TElementData>) {
        this.params = params;
    }

    static create<TValue, TElementData = any>(params: ElementInputParams<TValue, TElementData>) {
        return new ElementInput<TValue, TElementData>(params);
    }

    getType() {
        return this.params.type;
    }

    isTranslatable() {
        return this.params.translatable ?? false;
    }

    getDefaultValue(element: Element<TElementData>): TValue | undefined {
        const value = this.params.getDefaultValue({ element });
        if (!value) {
            return undefined;
        }

        return value as TValue;
    }
}

export type ElementInputValues<T extends ElementInputs> = {
    [K in keyof T]: T[K] extends ElementInput<infer P> ? P | undefined : never;
};
