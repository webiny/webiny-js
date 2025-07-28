import { SortingDTO } from "@webiny/app-utils";

export interface SortRedirectsUseCaseParams {
    sorts: SortingDTO[];
}

export interface ISortRedirectsUseCase {
    execute: (params: SortRedirectsUseCaseParams) => Promise<void>;
}
