import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import { ListRedirectsRepositoryFactory } from "~/features/redirects/loadRedirects/ListRedirectsRepositoryFactory.js";
import { FilterRedirectsUseCase } from "~/features/redirects/loadRedirects/FilterRedirectsUseCase.js";
import type { IFilterRedirectsUseCase } from "~/features/redirects/loadRedirects/IFilterRedirectsUseCase.js";

export class FilterRedirects {
    public static getInstance(gateway: IListRedirectsGateway): IFilterRedirectsUseCase {
        const repository = new ListRedirectsRepositoryFactory().getRepository(gateway);
        return new FilterRedirectsUseCase(repository);
    }
}
