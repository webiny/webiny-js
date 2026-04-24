import { Result, createImplementation } from "@webiny/feature/api";
import {
    GetActiveRedirectsUseCase as UseCaseAbstraction,
    GetActiveRedirectsRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class GetActiveRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetActiveRedirectsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        return await this.repository.execute();
    }
}

export const GetActiveRedirectsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetActiveRedirectsUseCaseImpl,
    dependencies: [WbPermissions, GetActiveRedirectsRepository]
});
