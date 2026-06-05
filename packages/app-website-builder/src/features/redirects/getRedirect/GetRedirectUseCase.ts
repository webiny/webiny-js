import {
    GetRedirectUseCase as UseCaseAbstraction,
    GetRedirectRepository,
    type GetRedirectParams
} from "./abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

class GetRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetRedirectRepository.Interface) {}

    execute(params: GetRedirectParams): RedirectDto | undefined {
        return this.repository.execute(params);
    }
}

export const GetRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRedirectUseCaseImpl,
    dependencies: [GetRedirectRepository]
});
