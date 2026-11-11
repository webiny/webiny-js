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

    /** Checks the users one by one, as the real adapters do, and records each check. */
    public async filterReadableUsers(
        params: ReviewTargetReadAccess.UsersParams
    ): Promise<string[]> {
        const readable: string[] = [];
        for (const user of params.users) {
            if (params.limit !== undefined && readable.length >= params.limit) {
                break;
            }
            readChecks.push({
                userId: user.id,
                scope: params.read.type,
                targetRevisionId:
                    params.read.type === "target" ? params.read.targetRevisionId : null,
                folderId: params.read.type === "folder" ? params.read.folderId : null,
                authorizationEnabled: this.identityContext.isAuthorizationEnabled()
            });
            if (throwingReadChecks.has(user.id)) {
                throw new Error("The read check crashed.");
            }
            if (readableUsers.has(user.id)) {
                readable.push(user.id);
            }
        }
        return readable;
    }
}

export const FakeReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: FakeReviewTargetReadAccessImpl,
    dependencies: [IdentityContext]
});
