import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ListGlobalComponentsUseCase } from "~/features/globals/ListGlobalComponents/abstractions.js";
import type { GlobalComponent as WbGlobalComponent } from "~/domain/globals/abstractions.js";

export interface ListPageGlobalComponentsParams {
    // The page's language; nothing (or `"default"`) for a page without a language.
    language?: string | null;
}

export interface IListPageGlobalComponentsUseCase {
    execute(
        params: ListPageGlobalComponentsParams
    ): Promise<Result<WbGlobalComponent[], UseCaseError>>;
}

type UseCaseError = ListGlobalComponentsUseCase.Error;

/**
 * The global components a page in a language is delivered with: each global's record in the page's
 * language, or else in the site's default language, or else its `"default"` record. A page without a
 * language gets the `"default"` records.
 * Globals with neither are left out: the frontend renders them from their manifest defaults.
 */
export const ListPageGlobalComponentsUseCase = createAbstraction<IListPageGlobalComponentsUseCase>(
    "Wb/ListPageGlobalComponentsUseCase"
);

export namespace ListPageGlobalComponentsUseCase {
    export type Interface = IListPageGlobalComponentsUseCase;
    export type Error = UseCaseError;
    export type Params = ListPageGlobalComponentsParams;
    export type Return = Promise<Result<WbGlobalComponent[], UseCaseError>>;
    export type GlobalComponent = WbGlobalComponent;
}
