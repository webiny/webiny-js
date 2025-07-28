import type {
    DeleteRedirectParams,
    IDeleteRedirectUseCase
} from "~/features/redirects/deleteRedirect/IDeleteRedirectUseCase.js";
import type { IDeleteRedirectRepository } from "~/features/redirects/deleteRedirect/IDeleteRedirectRepository.js";
import { Redirect } from "~/domain/Redirect/index.js";

export class DeleteRedirectUseCase implements IDeleteRedirectUseCase {
    private repository: IDeleteRedirectRepository;

    constructor(repository: IDeleteRedirectRepository) {
        this.repository = repository;
    }

    async execute(params: DeleteRedirectParams) {
        await this.repository.execute(
            Redirect.create({
                id: params.id
            })
        );
    }
}
