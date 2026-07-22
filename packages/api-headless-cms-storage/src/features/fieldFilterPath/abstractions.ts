import { Abstraction } from "@webiny/di";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CreatePathCallableParams } from "../../plugins/CmsEntryFieldFilterPathPlugin.js";

export interface IFieldFilterPathHandler {
    canUse(field: Pick<CmsModelField, "fieldId" | "type">, parents: string[]): boolean;
    createPath(params: CreatePathCallableParams): string;
}

export interface IFieldFilterPathRegistry {
    register(fieldType: string, handler: IFieldFilterPathHandler): void;
    get(fieldType: string): IFieldFilterPathHandler | undefined;
}

export const FieldFilterPathRegistry = new Abstraction<IFieldFilterPathRegistry>(
    "Cms/Storage/FieldFilterPathRegistry"
);

export namespace FieldFilterPathRegistry {
    export type Interface = IFieldFilterPathRegistry;
    export type Handler = IFieldFilterPathHandler;
}
