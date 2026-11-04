import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteLayoutUseCase {
    // Delete a layout with all its revisions. A source layout's language versions are deleted with it. Fails with `WebsiteBuilder/Layout/InUse` while it's in use.
    execute(entryId: string): Promise<void>;
}

export const DeleteLayoutUseCase = createAbstraction<IDeleteLayoutUseCase>(
    "WebsiteBuilder/DeleteLayoutUseCase"
);

export namespace DeleteLayoutUseCase {
    export type Interface = IDeleteLayoutUseCase;
}
