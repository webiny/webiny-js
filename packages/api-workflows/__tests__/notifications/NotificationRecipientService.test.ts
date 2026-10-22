import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createRoutingContext,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { readableUsers, readChecks } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    createRequestedReview,
    NOW,
    REVIEW_TEAM_ID,
    requester
} from "~tests/__helpers/fixtures.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { ReviewData } from "~/domain/review/types.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingMember, RoutingMembersParams } from "~/domain/routing/types.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { ReviewValidationError } from "~/domain/review/errors.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { NotificationRecipientServiceFeature } from "~/features/notifications/NotificationRecipientService/feature.js";

/** The first step of the default review is "legal"; it was reached into the pool of the review team. */
const createReviewData = (): ReviewData => {
    return createRequestedReview().toData();
};

const createPoolParams = (review: ReviewData, stepId = "legal") => {
    return { review, stepId, now: new Date(NOW) };
};

const toMember = (id: string, overrides: Partial<RoutingMember> = {}): RoutingMember => {
    return {
        id,
        displayName: id,
        teamIds: [REVIEW_TEAM_ID],
        exclusion: null,
        canRead: true,
        ...overrides
    };
};

/** Answers `listMembers` with a fixed list, a failure or a throw, and records how it was called. */
class StubRouting implements RoutingEvaluatorService.Interface {
    public members: RoutingMember[] = [];
    public mode: "ok" | "fail" | "throw" = "ok";
    public readonly calls: RoutingMembersParams[] = [];
    /** Whether authorization was on during the last call; `null` before `watch`. */
    public authorizationEnabled: boolean | null = null;
    private identityContext: IdentityContext.Interface | null = null;

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async evaluate(): Promise<never> {
        throw new Error("Not used by these tests.");
    }

    public async listMembers(params: RoutingMembersParams) {
        this.calls.push(structuredClone(params));
        this.authorizationEnabled = this.identityContext
            ? this.identityContext.isAuthorizationEnabled()
            : null;
        if (this.mode === "throw") {
            throw new Error("The routing crashed.");
        }
        if (this.mode === "fail") {
            return Result.fail(new RoutingDependencyError(new Error("Users are not available.")));
        }
        return Result.ok(this.members.map(member => ({ ...member })));
    }

    public async checkUser(): Promise<never> {
        throw new Error("Not used by these tests.");
    }
}

class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): Promise<never> {
        throw new Error("The user lookup crashed.");
    }
}

const setupStubbed = async () => {
    const routing = new StubRouting();
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(RoutingEvaluatorService, routing);
            NotificationRecipientServiceFeature.register(container);
        }
    });
    routing.watch(context.container.resolve(IdentityContext));
    return { routing, service: context.container.resolve(NotificationRecipientService) };
};

const setupUsers = async (users: FakeUser[]) => {
    const fake = new FakeListUsers(users);
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, fake);
            NotificationRecipientServiceFeature.register(container);
        }
    });
    const identityContext = context.container.resolve(IdentityContext);
    fake.watch(identityContext);
    return {
        fake,
        identityContext,
        service: context.container.resolve(NotificationRecipientService)
    };
};

describe("NotificationRecipientService.listPool (R183, R194)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("keeps only members who are not excluded and can read; the requester is absent", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        // Anna and Bob can read, Cara cannot. Bob is excluded. The requester is in the team too.
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        routing.settings.exclusions = [{ userId: "user-bob", reason: "On leave" }];
        expect(ROUTING_USERS.map(user => user.id)).toContain(requester.id);

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([{ id: "user-anna", displayName: "Anna" }]);
        expect(result.value.map(recipient => recipient.id)).not.toContain(requester.id);
    });

    it("returns every member who can read, sorted by id, when nobody is excluded", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        readableUsers.add("user-cara");

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.value).toEqual([
            { id: "user-anna", displayName: "Anna" },
            { id: "user-bob", displayName: "Bob" },
            { id: "user-cara", displayName: "Cara" }
        ]);
    });

    it("wraps nothing in withoutAuthorization: the read checks run as the request identity", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        readableUsers.add("user-anna");

        await service.listPool(createPoolParams(createReviewData()));

        // The routing service's own membership lookup runs without authorization (D48); the
        // read checks it makes per member run with it.
        expect(routing.users.calls).toEqual([
            { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
        ]);
        expect(readChecks.length).toBeGreaterThan(0);
        expect(readChecks.every(check => check.authorizationEnabled)).toBe(true);
    });

    it("drops an excluded member, a non-reader and an excluded non-reader (stubbed flags)", async () => {
        const { routing, service } = await setupStubbed();
        routing.members = [
            toMember("user-a"),
            toMember("user-b", { exclusion: { userId: "user-b", reason: "On leave" } }),
            toMember("user-c", { canRead: false }),
            toMember("user-d", { exclusion: { userId: "user-d" }, canRead: false }),
            toMember("user-e")
        ];

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.value).toEqual([
            { id: "user-a", displayName: "user-a" },
            { id: "user-e", displayName: "user-e" }
        ]);
    });

    it("builds the routing params from the review's step like ListStepCandidatesUseCase", async () => {
        const { routing, service } = await setupStubbed();
        const review = createReviewData();
        review.steps[0].candidateTeamIds = ["team-one", "team-two"];

        await service.listPool(createPoolParams(review));

        expect(routing.calls).toEqual([
            {
                teamIds: ["team-one", "team-two"],
                requesterId: review.createdBy.id,
                model: review.model,
                read: {
                    type: "target",
                    targetId: review.targetId,
                    targetRevisionId: review.targetRevisionId
                },
                now: new Date(NOW)
            }
        ]);
        expect(routing.authorizationEnabled).toBe(true);
    });

    it("returns an empty pool for a step with no candidate teams", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        const review = createReviewData();
        review.steps[0].candidateTeamIds = [];

        const result = await service.listPool(createPoolParams(review));

        expect(result.value).toEqual([]);
    });

    it("fails for a step that is not in the review, without asking routing", async () => {
        const { routing, service } = await setupStubbed();

        const result = await service.listPool(createPoolParams(createReviewData(), "missing"));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(ReviewValidationError);
        expect(routing.calls).toEqual([]);
    });

    it("fails with a persistence error when listMembers fails (real routing, failing user lookup)", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        routing.users.failuresLeft = 1;

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("fails with a persistence error when listMembers returns a failed Result", async () => {
        const { routing, service } = await setupStubbed();
        routing.mode = "fail";

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
    });

    it("fails with a persistence error, and does not reject, when listMembers throws", async () => {
        const { routing, service } = await setupStubbed();
        routing.mode = "throw";

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "The routing crashed."
        );
    });
});

describe("NotificationRecipientService.listUsers (R194, A67)", () => {
    const USERS: FakeUser[] = [
        { id: "user-anna", displayName: "Anna", teams: [] },
        { id: "user-bob", displayName: "Bob", teams: [] }
    ];

    it("returns the users it finds, omits the ids it does not, and looks up under withoutAuthorization", async () => {
        const { fake, identityContext, service } = await setupUsers(USERS);

        const result = await service.listUsers(["user-anna", "user-ghost", "user-bob"]);

        expect(result.value).toEqual([
            { id: "user-anna", email: "user-anna@webiny.test", displayName: "Anna" },
            { id: "user-bob", email: "user-bob@webiny.test", displayName: "Bob" }
        ]);
        expect(fake.calls).toEqual([
            {
                input: { where: { id_in: ["user-anna", "user-ghost", "user-bob"] } },
                authorizationEnabled: false
            }
        ]);
        // Only the lookup ran without authorization.
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("de-duplicates the ids and drops blank ones", async () => {
        const { fake, service } = await setupUsers(USERS);

        const result = await service.listUsers(["user-anna", "user-anna", "", "user-bob"]);

        expect(result.value.map(user => user.id)).toEqual(["user-anna", "user-bob"]);
        expect(fake.calls.map(call => call.input)).toEqual([
            { where: { id_in: ["user-anna", "user-bob"] } }
        ]);
    });

    it("returns an empty list without a lookup for no ids or only blank ids", async () => {
        const { fake, service } = await setupUsers(USERS);

        const none = await service.listUsers([]);
        const blank = await service.listUsers(["", ""]);

        expect(none.value).toEqual([]);
        expect(blank.value).toEqual([]);
        expect(fake.calls).toEqual([]);
    });

    it("looks up in chunks of MAX_USER_LIST_LIMIT", async () => {
        const many: FakeUser[] = Array.from({ length: 450 }, (_, index) => {
            return { id: `user-${index}`, displayName: `User ${index}`, teams: [] };
        });
        const { fake, service } = await setupUsers(many);

        const result = await service.listUsers(many.map(user => user.id));

        expect(MAX_USER_LIST_LIMIT).toBe(200);
        expect(fake.calls.map(call => call.input.where?.id_in?.length)).toEqual([200, 200, 50]);
        expect(fake.calls.every(call => call.authorizationEnabled === false)).toBe(true);
        expect(result.value).toHaveLength(450);
    });

    it("fails with a persistence error for a failed lookup and stops at the first failing chunk", async () => {
        const many: FakeUser[] = Array.from({ length: 450 }, (_, index) => {
            return { id: `user-${index}`, displayName: `User ${index}`, teams: [] };
        });
        const { fake, service } = await setupUsers(many);
        fake.failuresLeft = 1;

        const result = await service.listUsers(many.map(user => user.id));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(fake.calls).toHaveLength(1);
    });

    it("fails with a persistence error, does not reject and restores authorization when the lookup throws", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.registerInstance(ListUsersUseCase, new ThrowingListUsers());
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = context.container.resolve(NotificationRecipientService);

        const result = await service.listUsers(["user-anna"]);

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "The user lookup crashed."
        );
        expect(context.container.resolve(IdentityContext).isAuthorizationEnabled()).toBe(true);
    });
});
