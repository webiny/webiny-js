import { Result } from "@webiny/feature/api";
import {
    SetDefaultLayoutRepository,
    SetDefaultLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { GetPublishedLayoutRepository } from "~/features/layouts/GetPageLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError, LayoutValidationError } from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";

class SetDefaultLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private getPublishedLayout: GetPublishedLayoutRepository.Interface,
        private repository: SetDefaultLayoutRepository.Interface
    ) {}

    async execute(id: string | null): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        if (id === null || id === undefined || id === "") {
            return this.repository.execute({ defaultLayout: null });
        }

        const entryId = LayoutEntryId.from(id).toString();

        const layout = await this.getLayout.execute(entryId);
        if (layout.isFail()) {
            return Result.fail(layout.error);
        }

        if (LayoutLineage.from(layout.value).isLanguageVersion()) {
            return Result.fail(
                new LayoutValidationError(
                    "Only a source layout can be the default layout, not one of its language versions."
                )
            );
        }

        const published = await this.getPublishedLayout.execute(entryId);
        if (published.isFail()) {
            return Result.fail(published.error);
        }

        if (!published.value) {
            return Result.fail(
                new LayoutValidationError("Only a published layout can be the default layout.")
            );
        }

        return this.repository.execute({ defaultLayout: entryId });
    }
}

export const SetDefaultLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetDefaultLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        GetLayoutRepository,
        GetPublishedLayoutRepository,
        SetDefaultLayoutRepository
    ]
});
