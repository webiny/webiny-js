import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IGetLayoutRevisionsUseCase {
    // Load all revisions of a layout. They're also kept in the repository (`getLoadedRevisions`).
    execute(entryId: string): Promise<Layout[]>;
}

export const GetLayoutRevisionsUseCase = createAbstraction<IGetLayoutRevisionsUseCase>(
    "WebsiteBuilder/GetLayoutRevisionsUseCase"
);

export namespace GetLayoutRevisionsUseCase {
    export type Interface = IGetLayoutRevisionsUseCase;
}
