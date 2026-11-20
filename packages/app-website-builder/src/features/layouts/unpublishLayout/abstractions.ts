import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IUnpublishLayoutUseCase {
    // Unpublish a revision. Fails with `WebsiteBuilder/Layout/InUse` while pages use the layout.
    execute(id: string): Promise<Layout>;
}

export const UnpublishLayoutUseCase = createAbstraction<IUnpublishLayoutUseCase>(
    "WebsiteBuilder/UnpublishLayoutUseCase"
);

export namespace UnpublishLayoutUseCase {
    export type Interface = IUnpublishLayoutUseCase;
}
