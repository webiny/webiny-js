import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { ListReviewAssignmentsUseCase } from "~/features/assignment/ListReviewAssignments/index.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    KNOWN_USER_ID,
    KNOWN_USER_NAME,
    OTHER_KNOWN_USER_ID,
    OTHER_KNOWN_USER_NAME,
    registerFakeNamedUsers,
    userLookups,
    type FakeNamedUsersMode
} from "~tests/__helpers/FakeNamedUsers.js";

const record = (reviewId: string, hour: string): AssignmentRecordValues => {
    return {
        reviewId,
        workflowId: "workflow-1",
        stepId: "legal",
        userId: reviewer.id,
        assignedOn: `2026-10-09T${hour}:00:00.000Z`,
        source: "roundRobin",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome"
    };
};

interface ListFaults {
    failList: boolean;
}

/** Real records, read in pages of 2 through a wrapper that counts the list calls. */
const createAssignmentContext = async () => {
    const { context } = await createContextHandler();
    const assignments = context.container.resolve(AssignmentRepository);
    for (const hour of ["10", "11", "12", "13", "14"]) {
        expectOk(await assignments.create(record("review-1", hour)));
    }
    expectOk(await assignments.create(record("review-2", "15")));

    const faults: ListFaults = { failList: false };
    let listCalls = 0;
    // The use case gets this wrapper; the seeding above used the real repository.
    context.container.registerInstance(AssignmentRepository, {
        create: values => assignments.create(values),
        list: async params => {
            listCalls++;
            if (faults.failList) {
                return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
            }
            return assignments.list({ ...params, limit: 2 });
        },
        deleteMany: ids => assignments.deleteMany(ids)
    });

    return {
        faults,
        listCalls: () => listCalls,
        listAssignments: context.container.resolve(ListReviewAssignmentsUseCase)
    };
};

describe("ListReviewAssignmentsUseCase (R96)", () => {
    it("returns every record of the review, newest first, across pages", async () => {
        const { listAssignments, listCalls } = await createAssignmentContext();

        const records = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(records.map(item => item.assignedOn)).toEqual([
            "2026-10-09T14:00:00.000Z",
            "2026-10-09T13:00:00.000Z",
            "2026-10-09T12:00:00.000Z",
            "2026-10-09T11:00:00.000Z",
            "2026-10-09T10:00:00.000Z"
        ]);
        expect(records.every(item => item.reviewId === "review-1")).toBe(true);
        expect(listCalls()).toBe(3);
    });

    it("returns an empty list for a review without records", async () => {
        const { listAssignments } = await createAssignmentContext();

        const records = expectOk(await listAssignments.execute({ reviewId: "review-none" }));

        expect(records).toEqual([]);
    });

    it("fails with the assignment persistence error when a page fails", async () => {
        const { listAssignments, faults } = await createAssignmentContext();
        faults.failList = true;

        const result = await listAssignments.execute({ reviewId: "review-1" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });

    it("ends after two calls when the repository repeats a cursor", async () => {
        const { context } = await createContextHandler();
        let calls = 0;
        context.container.registerInstance(AssignmentRepository, {
            create: async () => Result.fail(new AssignmentPersistenceError(new Error("Unused."))),
            list: async () => {
                calls++;
                return Result.ok({
                    items: [],
                    meta: { cursor: "same", hasMoreItems: true, totalCount: 0 }
                });
            },
            deleteMany: async () =>
                Result.fail(new AssignmentPersistenceError(new Error("Unused.")))
        });

        const records = expectOk(
            await context.container
                .resolve(ListReviewAssignmentsUseCase)
                .execute({ reviewId: "review-1" })
        );

        expect(records).toEqual([]);
        expect(calls).toBe(2);
    });
});

/** Has a workflows permission, but no users permission, as a reviewer has. */
const REVIEWER_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", reassign: true }];

interface NamesSetupParams {
    permissions?: SecurityPermission[];
    mode?: FakeNamedUsersMode;
}

/** Records of one review for two known users (twice for one of them), a deleted user and the pool. */
const createNamesContext = async (params: NamesSetupParams = {}) => {
    const { context } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            registerFakeNamedUsers(container, params.mode);
        }
    });
    const assignments = context.container.resolve(AssignmentRepository);
    const users = [KNOWN_USER_ID, OTHER_KNOWN_USER_ID, KNOWN_USER_ID, "user-gone", null];
    for (const [index, userId] of users.entries()) {
        expectOk(await assignments.create({ ...record("review-1", String(10 + index)), userId }));
    }
    userLookups.length = 0;
    return {
        container: context.container,
        listAssignments: context.container.resolve(ListReviewAssignmentsUseCase)
    };
};

describe("ListReviewAssignmentsUseCase: display names (R251)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        userLookups.length = 0;
    });

    it("names every entry with one user list of the distinct user ids", async () => {
        const { listAssignments } = await createNamesContext();

        const entries = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(entries.map(entry => [entry.userId, entry.userDisplayName])).toEqual([
            [null, null],
            ["user-gone", null],
            [KNOWN_USER_ID, KNOWN_USER_NAME],
            [OTHER_KNOWN_USER_ID, OTHER_KNOWN_USER_NAME],
            [KNOWN_USER_ID, KNOWN_USER_NAME]
        ]);
        expect(userLookups).toHaveLength(1);
        expect([...userLookups[0].ids].sort()).toEqual(
            ["user-gone", KNOWN_USER_ID, OTHER_KNOWN_USER_ID].sort()
        );
        expect(loggedErrors).toEqual([]);
    });

    it("reads the names without authorization for a viewer without the users permission", async () => {
        const { container, listAssignments } = await createNamesContext({
            permissions: REVIEWER_PERMISSIONS
        });
        const identityContext = container.resolve(IdentityContext);
        const withoutAuthorization = vi.spyOn(identityContext, "withoutAuthorization");

        const entries = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(entries.find(entry => entry.userId === KNOWN_USER_ID)?.userDisplayName).toBe(
            KNOWN_USER_NAME
        );
        expect(withoutAuthorization).toHaveBeenCalledTimes(1);
        expect(userLookups.map(lookup => lookup.authorizationEnabled)).toEqual([false]);
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("returns the entries without names, logged once, when the user list fails", async () => {
        const { listAssignments } = await createNamesContext({ mode: "failing" });

        const entries = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(entries).toHaveLength(5);
        expect(entries.every(entry => entry.userDisplayName === null)).toBe(true);
        expect(loggedErrors.map(error => error.message)).toEqual([
            "Could not look up the display names of a review's assignment entries."
        ]);
    });

    it("returns the entries without names, logged once, when the user list throws", async () => {
        const { container, listAssignments } = await createNamesContext({ mode: "throwing" });

        const entries = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(entries.every(entry => entry.userDisplayName === null)).toBe(true);
        expect(loggedErrors).toHaveLength(1);
        expect(container.resolve(IdentityContext).isAuthorizationEnabled()).toBe(true);
    });

    it("reads no users for a review whose entries name nobody", async () => {
        const { listAssignments } = await createNamesContext();

        const entries = expectOk(await listAssignments.execute({ reviewId: "review-none" }));

        expect(entries).toEqual([]);
        expect(userLookups).toEqual([]);
    });
});
