import { Result } from "@webiny/feature/api";
import {
    GetLayoutRevisionsRepository,
    GetLayoutRevisionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

class GetLayoutRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetLayoutRevisionsRepository.Interface
    ) {}

    async execute(entryId: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const result = await this.repository.execute(LayoutEntryId.from(entryId).toString());
        if (result.isFail()) {
            return result;
        }

        const [latest] = result.value;
        if (latest && !(await this.permissions.canAccess("page", latest))) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        return result;
    }
}

export const GetLayoutRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutRevisionsUseCaseImpl,
    dependencies: [WbPermissions, GetLayoutRevisionsRepository]
});
