import type { ISelectPagesUseCase } from "~/features/pages/selectPages/ISelectPagesUseCases.js";
import { selectedItemsRepositoryFactory } from "~/domain/SelectedItem/index.js";
import { SelectPagesUseCase } from "~/features/pages/selectPages/SelectPagesUseCase.js";

export class SelectPages {
    public static getInstance<T = any>(): ISelectPagesUseCase<T> {
        const repository = selectedItemsRepositoryFactory.getRepository<T>("WbPage");
        return new SelectPagesUseCase<T>(repository);
    }
}
