import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface ITranslateLayoutUseCase {
    // Create the language version of a source layout in `language`, as a draft.
    execute(id: string, language: string): Promise<Layout>;
}

export const TranslateLayoutUseCase = createAbstraction<ITranslateLayoutUseCase>(
    "WebsiteBuilder/TranslateLayoutUseCase"
);

export namespace TranslateLayoutUseCase {
    export type Interface = ITranslateLayoutUseCase;
}
