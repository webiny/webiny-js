import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteLayoutRevisionUseCase {
    // Delete a revision. Fails with `WebsiteBuilder/Layout/InUse` for the published revision of a layout in use.
    execute(id: string): Promise<void>;
}

export const DeleteLayoutRevisionUseCase = createAbstraction<IDeleteLayoutRevisionUseCase>(
    "WebsiteBuilder/DeleteLayoutRevisionUseCase"
);

export namespace DeleteLayoutRevisionUseCase {
    export type Interface = IDeleteLayoutRevisionUseCase;
}
