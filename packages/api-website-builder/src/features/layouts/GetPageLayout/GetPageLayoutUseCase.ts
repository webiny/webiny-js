import { Result } from "@webiny/feature/api";
import {
    GetPageLayoutUseCase as UseCaseAbstraction,
    GetPublishedLayoutRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

class GetPageLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetPublishedLayoutRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        if (typeof params.layoutId !== "string" || !params.layoutId) {
            return Result.ok(null);
        }

        const sourceId = LayoutEntryId.from(params.layoutId);

        if (typeof params.language === "string" && params.language) {
            const version = await this.repository.execute(
                sourceId.versionIn(params.language).toString()
            );
            if (version.isFail()) {
                return version;
            }
            if (version.value) {
                return version;
            }
        }

        return this.repository.execute(sourceId.toString());
    }
}

export const GetPageLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageLayoutUseCaseImpl,
    dependencies: [WbPermissions, GetPublishedLayoutRepository]
});
