import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IDuplicateLayoutUseCase {
    // Duplicate a source layout into a new draft "Title (copy)", in the same language.
    execute(id: string): Promise<Layout>;
}

export const DuplicateLayoutUseCase = createAbstraction<IDuplicateLayoutUseCase>(
    "WebsiteBuilder/DuplicateLayoutUseCase"
);

export namespace DuplicateLayoutUseCase {
    export type Interface = IDuplicateLayoutUseCase;
}
