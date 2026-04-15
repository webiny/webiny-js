import { createAbstraction } from "@webiny/feature/admin";

//
// UseCase
//
export interface ISelectPagesUseCase {
    execute(pages: any[]): Promise<void>;
}

export const SelectPagesUseCase = createAbstraction<ISelectPagesUseCase>(
    "WebsiteBuilder/SelectPagesUseCase"
);

export namespace SelectPagesUseCase {
    export type Interface = ISelectPagesUseCase;
}
