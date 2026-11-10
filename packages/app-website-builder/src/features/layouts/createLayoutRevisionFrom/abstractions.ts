import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface ICreateLayoutRevisionFromUseCase {
    // Create a new draft revision from a revision.
    execute(id: string): Promise<Layout>;
}

export const CreateLayoutRevisionFromUseCase = createAbstraction<ICreateLayoutRevisionFromUseCase>(
    "WebsiteBuilder/CreateLayoutRevisionFromUseCase"
);

export namespace CreateLayoutRevisionFromUseCase {
    export type Interface = ICreateLayoutRevisionFromUseCase;
}
