import { createAbstraction } from "@webiny/feature/admin";
import type { Layout, CreateLayoutData } from "../shared/abstractions.js";

export interface ICreateLayoutUseCase {
    // Create a source layout. Fails if the title is empty.
    execute(data: CreateLayoutData): Promise<Layout>;
}

export const CreateLayoutUseCase = createAbstraction<ICreateLayoutUseCase>(
    "WebsiteBuilder/CreateLayoutUseCase"
);

export namespace CreateLayoutUseCase {
    export type Interface = ICreateLayoutUseCase;
}
