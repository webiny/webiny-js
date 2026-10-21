import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export type ReadCheckScope = "target" | "folder";

export interface ReadCheckCall {
    userId: string;
    scope: ReadCheckScope;
    targetRevisionId: string | null;
    folderId: string | null;
    /** Must be `true`: read checks run as the request identity. */
    authorizationEnabled: boolean;
}

/** Users the fake lets read every "cms.article" target and folder. Reset per test. */
export const readableUsers = new Set<string>();

/** Every read check, in order. Reset per test. */
export const readChecks: ReadCheckCall[] = [];

/** Users whose read check throws. Reset per test. */
export const throwingReadChecks = new Set<string>();

class FakeReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public canHandle(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        readChecks.push({
            userId: params.userId,
            scope: "target",
            targetRevisionId: params.targetRevisionId,
            folderId: null,
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        if (throwingReadChecks.has(params.userId)) {
            throw new Error("The read check crashed.");
        }
        return readableUsers.has(params.userId);
    }

    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        readChecks.push({
            userId: params.userId,
            scope: "folder",
            targetRevisionId: null,
            folderId: params.folderId,
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        if (throwingReadChecks.has(params.userId)) {
            throw new Error("The read check crashed.");
        }
        return readableUsers.has(params.userId);
    }
}

export const FakeReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: FakeReviewTargetReadAccessImpl,
    dependencies: [IdentityContext]
});
