import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryOpenSearchFieldIndex } from "./CmsEntryOpenSearchFieldIndex.js";

export interface ICmsEntryOpenSearchFieldIndexRegistry {
    get(fieldType: string): CmsEntryOpenSearchFieldIndex.Interface | undefined;
    getAll(): CmsEntryOpenSearchFieldIndex.Interface[];
}

export const CmsEntryOpenSearchFieldIndexRegistry =
    createAbstraction<ICmsEntryOpenSearchFieldIndexRegistry>(
        "Cms/Entry/OpenSearch/FieldIndexRegistry"
    );

export namespace CmsEntryOpenSearchFieldIndexRegistry {
    export type Interface = ICmsEntryOpenSearchFieldIndexRegistry;
}
