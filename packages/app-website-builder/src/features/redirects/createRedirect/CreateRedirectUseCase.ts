import {
    CreateRedirectUseCase as UseCaseAbstraction,
    CreateRedirectRepository,
    type CreateRedirectUseCaseParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class CreateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateRedirectRepository.Interface) {}

    async execute(params: CreateRedirectUseCaseParams): Promise<Redirect> {
        return this.repository.execute(params);
    }
}

export const CreateRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRedirectUseCaseImpl,
    dependencies: [CreateRedirectRepository]
});
