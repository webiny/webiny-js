import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryOpenSearchValueSearch } from "./CmsEntryOpenSearchValueSearch.js";

export interface ICmsEntryOpenSearchValueSearchRegistry {
    get(fieldType: string): CmsEntryOpenSearchValueSearch.Interface | undefined;
    getAll(): CmsEntryOpenSearchValueSearch.Interface[];
}

export const CmsEntryOpenSearchValueSearchRegistry =
    createAbstraction<ICmsEntryOpenSearchValueSearchRegistry>(
        "Cms/Entry/OpenSearch/ValueSearchRegistry"
    );

export namespace CmsEntryOpenSearchValueSearchRegistry {
    export type Interface = ICmsEntryOpenSearchValueSearchRegistry;
    export type SearchValue = CmsEntryOpenSearchValueSearch.Interface;
}
