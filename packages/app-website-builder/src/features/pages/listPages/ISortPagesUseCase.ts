import { SortingDTO } from "@webiny/app-utils";

export interface SortPagesUseCaseParams {
    sorts: SortingDTO[];
}

export interface ISortPagesUseCase {
    execute: (params: SortPagesUseCaseParams) => Promise<void>;
}
