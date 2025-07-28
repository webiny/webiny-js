import { IUpdateRedirectUseCase, type UpdateRedirectParams } from "./IUpdateRedirectUseCase.js";
import { IUpdateRedirectRepository } from "./IUpdateRedirectRepository.js";
import { Redirect } from "~/domain/Redirect/index.js";

export class UpdateRedirectUseCase implements IUpdateRedirectUseCase {
    private repository: IUpdateRedirectRepository;

    constructor(repository: IUpdateRedirectRepository) {
        this.repository = repository;
    }

    async execute(params: UpdateRedirectParams) {
        await this.repository.execute(
            Redirect.create({
                id: params.id,
                redirectFrom: params.redirectFrom,
                redirectTo: params.redirectTo,
                redirectType: params.redirectType,
                isEnabled: params.isEnabled
            })
        );
    }
}
