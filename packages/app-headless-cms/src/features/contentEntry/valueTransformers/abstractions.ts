import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModelField } from "~/types.js";

export interface ICmsEntryValueTransformer {
    readonly fieldType: string;
    transform(value: unknown, field: CmsModelField): unknown;
}

export const CmsEntryValueTransformer = createAbstraction<ICmsEntryValueTransformer>(
    "CmsEntryValueTransformer"
);

export namespace CmsEntryValueTransformer {
    export type Interface = ICmsEntryValueTransformer;
}
