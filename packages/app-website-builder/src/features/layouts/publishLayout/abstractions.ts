import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IPublishLayoutUseCase {
    // Publish a revision. The previously published revision of the layout is unpublished.
    execute(id: string): Promise<Layout>;
}

export const PublishLayoutUseCase = createAbstraction<IPublishLayoutUseCase>(
    "WebsiteBuilder/PublishLayoutUseCase"
);

export namespace PublishLayoutUseCase {
    export type Interface = IPublishLayoutUseCase;
}
