import { Result, createImplementation } from "@webiny/feature/api";
import {
    GetRedirectByIdUseCase as UseCaseAbstraction,
    GetRedirectByIdRepository
} from "./abstractions.js";
import { WbPermissions } from "~/domain/permissions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class GetRedirectByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetRedirectByIdRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        const result = await this.repository.execute(id);

        if (result.isFail()) {
            return result;
        }

        const canAccess = await this.permissions.canAccess("redirect", result.value);
        if (!canAccess) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        return result;
    }
}

export const GetRedirectByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRedirectByIdUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, GetRedirectByIdRepository]
});
