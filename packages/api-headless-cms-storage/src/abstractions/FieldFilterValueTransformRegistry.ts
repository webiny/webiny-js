import { Abstraction } from "@webiny/di";
import type { CmsFieldFilterValueTransformParams } from "../plugins/CmsFieldFilterValueTransformPlugin.js";

export interface IFieldFilterValueTransformHandler {
    transform(params: CmsFieldFilterValueTransformParams): any;
}

export interface IFieldFilterValueTransformRegistry {
    register(fieldType: string, handler: IFieldFilterValueTransformHandler): void;
    get(fieldType: string): IFieldFilterValueTransformHandler | undefined;
}

export const FieldFilterValueTransformRegistry =
    new Abstraction<IFieldFilterValueTransformRegistry>(
        "Cms/Storage/FieldFilterValueTransformRegistry"
    );

export namespace FieldFilterValueTransformRegistry {
    export type Interface = IFieldFilterValueTransformRegistry;
    export type Handler = IFieldFilterValueTransformHandler;
}
