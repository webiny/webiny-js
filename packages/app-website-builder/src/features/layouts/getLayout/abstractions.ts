import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IGetLayoutUseCase {
    // Load a layout revision by its revision id, or the latest revision by its entry id.
    execute(id: string): Promise<Layout>;
}

export const GetLayoutUseCase = createAbstraction<IGetLayoutUseCase>(
    "WebsiteBuilder/GetLayoutUseCase"
);

export namespace GetLayoutUseCase {
    export type Interface = IGetLayoutUseCase;
}
