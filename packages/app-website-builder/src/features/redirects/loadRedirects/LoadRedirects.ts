import type { ILoadRedirectsUseCase } from "~/features/redirects/loadRedirects/ILoadRedirectsUseCase.js";
import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import { LoadRedirectsUseCase } from "~/features/redirects/loadRedirects/LoadRedirectsUseCase.js";
import { listRedirectsRepositoryFactory } from "~/features/redirects/loadRedirects/ListRedirectsRepositoryFactory.js";

export class LoadRedirects {
    public static getInstance(gateway: IListRedirectsGateway): ILoadRedirectsUseCase {
        const repository = listRedirectsRepositoryFactory.getRepository(gateway);
        return new LoadRedirectsUseCase(repository);
    }
}
