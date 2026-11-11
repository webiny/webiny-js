import { createAbstraction } from "@webiny/feature/admin";
import type { Layout, UpdateLayoutData } from "../shared/abstractions.js";

export interface IUpdateLayoutUseCase {
    // Save a draft revision. Resolves with the saved revision.
    execute(id: string, data: UpdateLayoutData): Promise<Layout>;
}

export const UpdateLayoutUseCase = createAbstraction<IUpdateLayoutUseCase>(
    "WebsiteBuilder/UpdateLayoutUseCase"
);

export namespace UpdateLayoutUseCase {
    export type Interface = IUpdateLayoutUseCase;
}
