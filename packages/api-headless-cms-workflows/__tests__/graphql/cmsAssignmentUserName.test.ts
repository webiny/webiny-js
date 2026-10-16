import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { SKIP_RECORD_REASON } from "~tests/__helpers/seeds.js";
import { seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** Knows `REQUESTER` by name; every other id is "not found". Fails every lookup when `failing`. */
class SkippedUsers implements GetUserUseCase.Interface {
    public constructor(private failing: boolean) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        if (this.failing) {
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        if (input.id !== REQUESTER.id) {
            return Result.fail(new UserNotFoundError(input.id ?? "unknown"));
        }
        return Result.ok({
            id: REQUESTER.id,
            displayName: REQUESTER.displayName,
            email: "requester@webiny.test",
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}

const registerUsers = (container: Container) => {
    container.registerInstance(GetUserUseCase, new SkippedUsers(false));
};

const registerFailingUsers = (container: Container) => {
    container.registerInstance(GetUserUseCase, new SkippedUsers(true));
    captureLoggedErrors(container);
};

const ERROR = "error { code message data }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    review {
                        id
                        steps {
                            id
                            assignments { kind userId userDisplayName reason }
                        }
                    }
                }
                ${ERROR}
            }
        }
    }
`;

interface AssignmentRow {
    kind: string;
    userId: string | null;
    userDisplayName: string | null;
    reason: string | null;
}

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** Admin stores the workflow; "Ann" has a review whose only step has a skip and an outcome entry. */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    await seedAssignmentRecords(admin, review);
    return { review };
};

describe("CMS skipped-entry display names (R251, Q21)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("carries the display name on the skip entry of a single review read, and null on the outcome entry", async () => {
        const { review } = await createScenario();
        const editor = createGraphQLClient({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [registerUsers]
        });

        const body = await editor(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        const [step] = result.data.review.steps;
        expect(step.id).toBe(STEP_ID);
        const skip = step.assignments.find((entry: AssignmentRow) => entry.kind === "skip");
        const outcome = step.assignments.find((entry: AssignmentRow) => entry.kind === "outcome");
        expect(skip).toEqual({
            kind: "skip",
            userId: REQUESTER.id,
            userDisplayName: REQUESTER.displayName,
            reason: SKIP_RECORD_REASON
        });
        expect(outcome).toMatchObject({ kind: "outcome", userId: null, userDisplayName: null });
    });

    it("still returns the review, with a null name and one log, when the user lookup fails", async () => {
        const { review } = await createScenario();
        const editor = createGraphQLClient({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [registerFailingUsers]
        });

        const body = await editor(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.review.id).toBe(review.id);
        const skip = result.data.review.steps[0].assignments.find(
            (entry: AssignmentRow) => entry.kind === "skip"
        );
        expect(skip).toMatchObject({ userId: REQUESTER.id, userDisplayName: null });
        const lookupLogs = loggedErrors.filter(error => {
            return error.message === "Could not look up the display name of a skipped user.";
        });
        expect(lookupLogs).toHaveLength(1);
    });
});
