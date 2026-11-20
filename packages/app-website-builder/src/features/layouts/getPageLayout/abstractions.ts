import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IGetPageLayoutUseCase {
    // The published layout a page is rendered in: the published version in the page's language, else the published source layout, else `null`. `layoutId` is the source layout's entry id (the page's `properties.layout`).
    execute(layoutId: string, language: string | null): Promise<Layout | null>;
}

export const GetPageLayoutUseCase = createAbstraction<IGetPageLayoutUseCase>(
    "WebsiteBuilder/GetPageLayoutUseCase"
);

export namespace GetPageLayoutUseCase {
    export type Interface = IGetPageLayoutUseCase;
}
