import { Result } from "@webiny/feature/api";
import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListGroupsUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/ListGroups/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ReviewListReadFilter } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { ListReviewedModelsUseCase } from "@webiny/api-workflows/features/review/ListReviewedModels/index.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { UNREADABLE_CODES } from "../CmsEntryAccess/index.js";
import { CmsEntryDeniedFolders } from "../CmsEntryDeniedFolders/index.js";
import { CmsEntryReviewReadFilter as Abstraction } from "./abstractions.js";

class CmsEntryReviewReadFilterImpl implements Abstraction.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private listGroups: ListGroupsUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private deniedFolders: CmsEntryDeniedFolders.Interface,
        private listReviewedModels: ListReviewedModelsUseCase.Interface
    ) {}

    public async build(models: CmsModel[]): Abstraction.Return {
        const identity = this.identityContext.getIdentity();
        const filter: ReviewListReadFilter = {
            models: [],
            ownOnlyModels: [],
            authorId: identity.id,
            deniedFolderIds: []
        };
        if (models.length === 0) {
            return Result.ok(filter);
        }

        // The groups the identity can read, once; a model is found in it by its group's slug, as
        // `CmsModelGroupService` does. No group read at all leaves every model unreadable.
        const groups = await this.listGroups.execute();
        let readableGroups: CmsGroup[] = [];
        if (groups.isOk()) {
            readableGroups = groups.value;
        } else if (!UNREADABLE_CODES.includes(groups.error.code)) {
            return Result.fail(new ReviewPersistenceError(groups.error));
        }

        const readable: CmsModel[] = [];
        for (const model of models) {
            // In memory: the access control loads the identity's permissions once per request.
            const group = readableGroups.find(item => item.slug === model.group);
            if (!group || !(await this.accessControl.canAccessGroup({ group }))) {
                continue;
            }
            if (!(await this.accessControl.canAccessModel({ model }))) {
                continue;
            }
            if (!(await this.accessControl.canAccessEntry({ model, rwd: "r" }))) {
                continue;
            }
            const namespace = toCmsNamespace(model.modelId);
            if (await this.accessControl.canAccessOnlyOwnedEntries({ model })) {
                filter.ownOnlyModels.push(namespace);
            } else {
                filter.models.push(namespace);
            }
            readable.push(model);
        }
        if (readable.length === 0) {
            return Result.ok(filter);
        }

        // Folder rules only for the readable models with active reviews: no row of another
        // model can match the filter, so its folders need no read (one query for the namespaces).
        const reviewedModels = await this.listReviewedModels.execute();
        if (reviewedModels.isFail()) {
            return Result.fail(reviewedModels.error);
        }
        const reviewedModelIds = readable
            .filter(model => {
                const namespace = toCmsNamespace(model.modelId);
                return reviewedModels.value.includes(namespace);
            })
            .map(model => model.modelId);
        if (reviewedModelIds.length === 0) {
            return Result.ok(filter);
        }

        try {
            filter.deniedFolderIds = await this.deniedFolders.listDeniedFolderIds(reviewedModelIds);
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

export const CmsEntryReviewReadFilter = Abstraction.createImplementation({
    implementation: CmsEntryReviewReadFilterImpl,
    dependencies: [
        AccessControl,
        ListGroupsUseCase,
        IdentityContext,
        CmsEntryDeniedFolders,
        ListReviewedModelsUseCase
    ]
});
