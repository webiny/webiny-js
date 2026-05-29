import {
    UpdateRedirectUseCase as UseCaseAbstraction,
    UpdateRedirectRepository,
    type UpdateRedirectParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class UpdateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateRedirectRepository.Interface) {}

    async execute(params: UpdateRedirectParams): Promise<Redirect> {
        return this.repository.execute(params);
    }
}

export const UpdateRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRedirectUseCaseImpl,
    dependencies: [UpdateRedirectRepository]
});
