import type { CreateRedirectParams, ICreateRedirectUseCase } from "./ICreateRedirectUseCase.js";
import { ICreateRedirectRepository } from "./ICreateRedirectRepository.js";
import { Redirect } from "~/domain/Redirect/index.js";

export class CreateRedirectUseCase implements ICreateRedirectUseCase {
    private repository: ICreateRedirectRepository;

    constructor(repository: ICreateRedirectRepository) {
        this.repository = repository;
    }

    async execute(params: CreateRedirectParams) {
        return await this.repository.execute(
            Redirect.create({
                location: params.location,
                redirectFrom: params.redirectFrom,
                redirectTo: params.redirectTo,
                redirectType: params.redirectType,
                isEnabled: params.isEnabled
            })
        );
    }
}
