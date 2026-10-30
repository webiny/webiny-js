import { Result } from "@webiny/feature/api";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ReviewListReadFilter } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { ListReviewedModelsUseCase } from "@webiny/api-workflows/features/review/ListReviewedModels/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageDeniedFolders } from "../WbPageDeniedFolders/index.js";
import { WbPageReviewReadFilter as Abstraction } from "./abstractions.js";

class WbPageReviewReadFilterImpl implements Abstraction.Interface {
    public constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private deniedFolders: WbPageDeniedFolders.Interface,
        private listReviewedModels: ListReviewedModelsUseCase.Interface
    ) {}

    public async build(): Abstraction.Return {
        const identity = this.identityContext.getIdentity();
        const filter: ReviewListReadFilter = {
            models: [],
            ownOnlyModels: [],
            authorId: identity.id,
            deniedFolderIds: []
        };
        try {
            if (!(await this.permissions.canRead("page"))) {
                return Result.ok(filter);
            }
            if (await this.permissions.onlyOwnRecords("page")) {
                filter.ownOnlyModels.push(WB_PAGE_NAMESPACE);
            } else {
                filter.models.push(WB_PAGE_NAMESPACE);
            }
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }

        // Folder rules only when pages have active reviews: otherwise no row can match.
        const reviewedModels = await this.listReviewedModels.execute();
        if (reviewedModels.isFail()) {
            return Result.fail(reviewedModels.error);
        }
        if (!reviewedModels.value.includes(WB_PAGE_NAMESPACE)) {
            return Result.ok(filter);
        }
        try {
            filter.deniedFolderIds = await this.deniedFolders.listDeniedFolderIds();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        return Result.ok(filter);
    }
}

export const WbPageReviewReadFilter = Abstraction.createImplementation({
    implementation: WbPageReviewReadFilterImpl,
    dependencies: [WbPermissions, IdentityContext, WbPageDeniedFolders, ListReviewedModelsUseCase]
});
