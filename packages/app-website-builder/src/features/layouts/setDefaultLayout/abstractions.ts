import { createAbstraction } from "@webiny/feature/admin";
import type { LayoutSettings } from "../shared/abstractions.js";

export interface ISetDefaultLayoutUseCase {
    // Set the layout new pages get (a published source layout's entry id), or clear it with `null`.
    execute(entryId: string | null): Promise<LayoutSettings>;
}

export const SetDefaultLayoutUseCase = createAbstraction<ISetDefaultLayoutUseCase>(
    "WebsiteBuilder/SetDefaultLayoutUseCase"
);

export namespace SetDefaultLayoutUseCase {
    export type Interface = ISetDefaultLayoutUseCase;
}
