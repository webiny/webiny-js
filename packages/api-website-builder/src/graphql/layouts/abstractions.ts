import { createAbstraction } from "@webiny/feature/api";
import type { Layout } from "~/domain/layout/abstractions.js";

export interface IPageLayoutDtoMapper {
    // The layout a page is delivered with in the API response, or `null` for none.
    toApi(page: Record<string, any> | null | undefined): Promise<Layout | null>;
}

/**
 * Shapes `WbPage.layout`: a page that already carries its resolved layout keeps it; any other page gets
 * the published layout it references, or none when it references none or the layout can't be read.
 */
export const PageLayoutDtoMapper =
    createAbstraction<IPageLayoutDtoMapper>("Wb/PageLayoutDtoMapper");

export namespace PageLayoutDtoMapper {
    export type Interface = IPageLayoutDtoMapper;
}
