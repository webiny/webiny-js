import type { ISelectRedirectsUseCase } from "~/features/redirects/selectRedirects/ISelectRedirectsUseCases.js";
import { selectedItemsRepositoryFactory } from "~/domain/SelectedItem/index.js";
import { SelectRedirectsUseCase } from "~/features/redirects/selectRedirects/SelectRedirectsUseCase.js";

export class SelectRedirects {
    public static getInstance<T = any>(): ISelectRedirectsUseCase<T> {
        const repository = selectedItemsRepositoryFactory.getRepository<T>("WbRedirect");
        return new SelectRedirectsUseCase<T>(repository);
    }
}
