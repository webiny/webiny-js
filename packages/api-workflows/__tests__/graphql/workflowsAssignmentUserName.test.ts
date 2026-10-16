import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { registerFakeNamedUsers } from "~tests/__helpers/FakeNamedUsers.js";
import { userLookups } from "~tests/__helpers/FakeNamedUsers.js";
import type { FakeNamedUsersMode } from "~tests/__helpers/FakeNamedUsers.js";

/** Has a workflows permission, but no users permission, as a reviewer has. */
const REVIEWER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

interface ProbeArgs {
    userId?: string | null;
}

/**
 * The shared `WorkflowsAssignmentEntry` is only reachable through the app roots, which this package
 * does not have. A probe field returns an entry with only the `userId` the test sends, so the
 * field resolver of `userDisplayName` is exercised on the real shared schema.
 */
class AssignmentEntryProbeImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            extend type WorkflowsQuery {
                probeAssignmentEntry(userId: String): WorkflowsAssignmentEntry
            }
        `);
        builder.addResolver<ProbeArgs>({
            path: "WorkflowsQuery.probeAssignmentEntry",
            dependencies: [],
            resolver: () => {
                return async ({ args }) => {
                    const entry = {
                        id: "entry-1",
                        kind: "skip",
                        assignedOn: "2026-10-13T10:00:00.000Z",
                        source: "picked"
                    };
                    if (!args.userId) {
                        return entry;
                    }
                    return { ...entry, userId: args.userId };
                };
            }
        });
        return builder;
    }
}

const AssignmentEntryProbe = GraphQLSchemaFactory.createImplementation({
    implementation: AssignmentEntryProbeImpl,
    dependencies: []
});

/** An unexpected throw out of the use case, as a bug would cause. */
class ThrowingResolveUserNameImpl implements ResolveReviewUserNameUseCase.Interface {
    public constructor(private decoratee: ResolveReviewUserNameUseCase.Interface) {}

    public async execute(): ResolveReviewUserNameUseCase.Return {
        throw new Error("The use case crashed.");
    }
}

const ThrowingResolveUserName = ResolveReviewUserNameUseCase.createDecorator({
    decorator: ThrowingResolveUserNameImpl,
    dependencies: []
});

const PROBE = /* GraphQL */ `
    query Probe($userId: String) {
        workflows {
            probeAssignmentEntry(userId: $userId) {
                id
                userId
                userDisplayName
            }
        }
    }
`;

interface EntryRow {
    id: string;
    userId: string | null;
    userDisplayName: string | null;
}

interface ProbeBody {
    data: { workflows: { probeAssignmentEntry: EntryRow } };
    errors?: { message: string }[];
}

interface SetupParams extends CmsTestHandlerParams {
    mode?: FakeNamedUsersMode;
    throwing?: boolean;
}

const createApi = async (params: SetupParams = {}) => {
    const { createQuery } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            registerFakeNamedUsers(container, params.mode);
            container.register(AssignmentEntryProbe);
            if (params.throwing) {
                container.registerDecorator(ThrowingResolveUserName);
            }
        }
    });
    return { probe: createQuery<ProbeBody>(PROBE) };
};

describe("WorkflowsAssignmentEntry.userDisplayName (R251, A90)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        userLookups.length = 0;
    });

    it("returns the display name next to the user id", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: KNOWN_USER_ID,
            userDisplayName: KNOWN_USER_NAME
        });
    });

    it("gives a viewer without the users permission the name", async () => {
        const { probe } = await createApi({ permissions: REVIEWER });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBe(KNOWN_USER_NAME);
    });

    it("resolves null for a user that no longer exists and keeps the id", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ userId: "user-gone" });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: "user-gone",
            userDisplayName: null
        });
        expect(loggedErrors).toEqual([]);
    });

    it("resolves null with no lookup when the entry has no user id", async () => {
        const { probe } = await createApi();

        const [body] = await probe();

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: null,
            userDisplayName: null
        });
        expect(userLookups).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("resolves null and succeeds when the user lookup fails, with one log", async () => {
        const { probe } = await createApi({ mode: "failing" });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.id).toBe("entry-1");
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not look up the display name of a skipped user."
        );
    });

    it("resolves null and succeeds when the use case throws, with one log", async () => {
        const { probe } = await createApi({ throwing: true });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.userId).toBe(KNOWN_USER_ID);
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not resolve the display name of a skipped user."
        );
    });
});
