import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryOpenSearchFilter } from "./CmsEntryOpenSearchFilter.js";

export interface ICmsEntryOpenSearchFilterRegistry {
    get(fieldType: string): CmsEntryOpenSearchFilter.Interface;
}

export const CmsEntryOpenSearchFilterRegistry =
    createAbstraction<ICmsEntryOpenSearchFilterRegistry>("Cms/Entry/OpenSearch/FilterRegistry");

export namespace CmsEntryOpenSearchFilterRegistry {
    export type Interface = ICmsEntryOpenSearchFilterRegistry;
    export type Filter = CmsEntryOpenSearchFilter.Interface;
}
