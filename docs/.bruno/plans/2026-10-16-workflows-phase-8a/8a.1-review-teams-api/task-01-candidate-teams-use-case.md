### Task 1: `ListReviewCandidateTeamsUseCase` and the `candidateTeams` resolver

Spec 13.1, 13.3; user answer Q7 (`../00-answers.md`); R208, D158, A68, A69; R87 and D132 (a dependency failure never rejects a resolver), SEC-66 pattern (only the lookup runs without authorization). Review steps carry `candidateTeamIds` only, so the admin cannot name the teams of "Waiting in the {Team} team pool" (R232). This task adds the names server-side, once, in the shared schema, so the CMS and WB responses carry them without a wrapper change (Task 2 proves both).

- `ListReviewCandidateTeamsUseCase` (api-workflows, internal, no permission check of its own): de-duplicates the ids, reads each team with `GetTeamUseCase` inside **one** `identityContext.withoutAuthorization(...)` that wraps only the lookups, keeps `{ id, name }` in input order and leaves out a team that does not exist (`TeamNotFoundError`). A throw, or a failed Result that is not "not found", is a failed `ReviewPersistenceError`, logged once with `Could not look up the candidate teams of a review.`
- Shared schema: `type WorkflowsTeam { id: ID! name: String! }` and `WorkflowsReviewStep.candidateTeams: [WorkflowsTeam!]!` next to `candidateTeamIds`, resolved by a field resolver at `path: "WorkflowsReviewStep.candidateTeams"` (the mechanism of `SecurityTeam.roles` in `packages/api-core/src/graphql/security/addTeamSchema.ts`). The resolver never fails a read: a failed Result resolves `[]` (the use case logged), an unexpected throw is logged once with `Could not resolve the candidate teams of a review step.` and resolves `[]`; a step without `candidateTeamIds` resolves `[]`.
- A68 is proven by tests: `GetTeamUseCase` inside `withoutAuthorization` returns stored teams and plugin (code) teams, a viewer without `security.team` gets names, and an unknown id is a `TeamNotFoundError` failure. A69: the workflows request container registers the api-core `TeamsRepositoryCachingDecorator` (`TeamsFeature`), which caches successful reads only, so no cache is added here (a deleted team costs one failed lookup per occurrence per request, accepted).
- The feature is registered in `WorkflowsFeature` next to the other review use cases (every review use case has its own feature there; `ReviewLifecycleFeature` holds only defaults). Nothing is stored; no storage key, model or schema of the database changes.

**Files:**
- Create: `packages/api-workflows/src/features/review/ListReviewCandidateTeams/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ListReviewCandidateTeams/ListReviewCandidateTeamsUseCase.ts`
- Create: `packages/api-workflows/src/features/review/ListReviewCandidateTeams/feature.ts`
- Create: `packages/api-workflows/src/features/review/ListReviewCandidateTeams/index.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts`
- Create: `packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (it asserts the exact fields of `WorkflowsReviewStep`)
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Existing, must stay green: `packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts`

**Interfaces:**
- Consumes (existing, verified with codegraph and by running the tests below): `GetTeamUseCase` (`@webiny/api-core/features/security/teams/GetTeam/index.js`; `execute({ id })`, needs `security.team`), `TeamNotFoundError` (`@webiny/api-core/features/security/teams/shared/errors.js`, code `TEAM_NOT_FOUND`), `IdentityContext.withoutAuthorization` (`@webiny/api-core/features/security/IdentityContext/index.js`), `Logger` (`@webiny/api-core/features/logger/index.js`), `ReviewPersistenceError` (`~/domain/review/errors.js`), `GraphQLSchemaFactory` builder `addResolver` (`@webiny/api-graphql/graphql/abstractions.js`), test helpers `createContextHandler` (`__tests__/__helpers/handler.ts`), `captureLoggedErrors`/`loggedErrors` (`__helpers/CapturingLogger.ts`), `expectOk` (`__helpers/fixtures.ts`), `TeamFactory` (`@webiny/api-core/features/security/teams/shared/abstractions.js`, the code-team plugin point).
- Produces: `ReviewCandidateTeam { id: string; name: string }`; `ListReviewCandidateTeamsInput { teamIds: string[] }`; `ListReviewCandidateTeamsUseCase` (`"ListReviewCandidateTeamsUseCase"`, `execute(input): Promise<Result<ReviewCandidateTeam[], ReviewPersistenceError>>`, namespace `Interface`, `Input`, `Error`, `Return`), `ListReviewCandidateTeamsFeature` (`"Workflows/ListReviewCandidateTeams"`), GraphQL `WorkflowsTeam` and `WorkflowsReviewStep.candidateTeams`. Consumed by Task 2 and, through the fragments, Tasks 8, 11, 12.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Result } from "@webiny/feature/api";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { expectOk } from "~tests/__helpers/fixtures.js";

/** Has a workflows permission, but not `security.team`, as a reviewer has. */
const REVIEWER_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", reassign: true }];

class PluginTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [
            {
                name: "Legal",
                slug: "team-legal",
                description: "Defined in code.",
                roles: []
            },
            {
                name: "Marketing",
                slug: "team-marketing",
                description: "Defined in code.",
                roles: []
            }
        ];
    }
}

interface TeamLookupCall {
    teamId: string;
    authorizationEnabled: boolean;
}

/** Every `GetTeamUseCase.execute` call, with the authorization state it ran in. */
const teamLookups: TeamLookupCall[] = [];

class RecordingGetTeamImpl implements GetTeamUseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: GetTeamUseCase.Interface
    ) {}

    public async execute(params: Parameters<GetTeamUseCase.Interface["execute"]>[0]) {
        teamLookups.push({
            teamId: params.id ?? "",
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        return this.decoratee.execute(params);
    }
}

const RecordingGetTeam = GetTeamUseCase.createDecorator({
    decorator: RecordingGetTeamImpl,
    dependencies: [IdentityContext]
});

/** The lookup crashes, as a broken storage driver does. */
class ThrowingGetTeamImpl implements GetTeamUseCase.Interface {
    public constructor(private decoratee: GetTeamUseCase.Interface) {}

    public async execute(): ReturnType<GetTeamUseCase.Interface["execute"]> {
        throw new Error("Teams are down.");
    }
}

const ThrowingGetTeam = GetTeamUseCase.createDecorator({
    decorator: ThrowingGetTeamImpl,
    dependencies: []
});

/** The lookup returns a failed Result that is not "not found". */
class FailingGetTeamImpl implements GetTeamUseCase.Interface {
    public constructor(private decoratee: GetTeamUseCase.Interface) {}

    public async execute(): ReturnType<GetTeamUseCase.Interface["execute"]> {
        return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
    }
}

const FailingGetTeam = GetTeamUseCase.createDecorator({
    decorator: FailingGetTeamImpl,
    dependencies: []
});

interface SetupParams {
    permissions?: SecurityPermission[];
    throwing?: boolean;
    failing?: boolean;
}

const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(TeamFactory, new PluginTeamFactory());
            container.registerDecorator(RecordingGetTeam);
            if (params.throwing) {
                container.registerDecorator(ThrowingGetTeam);
            }
            if (params.failing) {
                container.registerDecorator(FailingGetTeam);
            }
        }
    });
    return {
        container: context.container,
        listTeams: context.container.resolve(ListReviewCandidateTeamsUseCase)
    };
};

describe("ListReviewCandidateTeamsUseCase (R208, A68, A69)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        teamLookups.length = 0;
    });

    it("names the teams in input order, de-duplicated, with id and name only", async () => {
        const { listTeams } = await setup();

        const teams = expectOk(
            await listTeams.execute({
                teamIds: ["team-marketing", "team-legal", "team-marketing"]
            })
        );

        expect(teams).toEqual([
            { id: "team-marketing", name: "Marketing" },
            { id: "team-legal", name: "Legal" }
        ]);
        expect(teamLookups.map(lookup => lookup.teamId)).toEqual(["team-marketing", "team-legal"]);
    });

    it("leaves out a team that does not exist and keeps the others", async () => {
        const { listTeams } = await setup();

        const teams = expectOk(await listTeams.execute({ teamIds: ["team-gone", "team-legal"] }));

        expect(teams).toEqual([{ id: "team-legal", name: "Legal" }]);
        expect(loggedErrors).toEqual([]);
    });

    it("resolves a team stored in the database and a team defined in code", async () => {
        const { container, listTeams } = await setup();
        const identityContext = container.resolve(IdentityContext);
        const created = await identityContext.withoutAuthorization(() => {
            return container.resolve(CreateTeam).execute({
                name: "Stored team",
                slug: "stored-team",
                description: "Stored in the database.",
                roles: []
            });
        });
        const stored = expectOk(created);

        const teams = expectOk(await listTeams.execute({ teamIds: [stored.id, "team-legal"] }));

        expect(teams).toEqual([
            { id: stored.id, name: "Stored team" },
            { id: "team-legal", name: "Legal" }
        ]);
    });

    it("gives a viewer without security.team the names, because the lookup runs without authorization", async () => {
        const { container, listTeams } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const direct = await container.resolve(GetTeamUseCase).execute({ id: "team-legal" });
        teamLookups.length = 0;

        const teams = expectOk(await listTeams.execute({ teamIds: ["team-legal"] }));

        expect(await identityContext.getPermission("security.team")).toBeNull();
        expect(direct.isFail()).toBe(true);
        expect(teams).toEqual([{ id: "team-legal", name: "Legal" }]);
    });

    it("wraps only the lookups in withoutAuthorization, once, and restores authorization", async () => {
        const { container, listTeams } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const withoutAuthorization = vi.spyOn(identityContext, "withoutAuthorization");

        expectOk(await listTeams.execute({ teamIds: ["team-legal", "team-marketing"] }));

        expect(withoutAuthorization).toHaveBeenCalledTimes(1);
        expect(teamLookups).toEqual([
            { teamId: "team-legal", authorizationEnabled: false },
            { teamId: "team-marketing", authorizationEnabled: false }
        ]);
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("does no lookup and no authorization change for an empty input", async () => {
        const { container, listTeams } = await setup();
        const withoutAuthorization = vi.spyOn(
            container.resolve(IdentityContext),
            "withoutAuthorization"
        );

        const teams = expectOk(await listTeams.execute({ teamIds: [] }));

        expect(teams).toEqual([]);
        expect(teamLookups).toEqual([]);
        expect(withoutAuthorization).not.toHaveBeenCalled();
    });

    it("fails with a persistence error, logged once, when the lookup throws", async () => {
        const { listTeams } = await setup({ throwing: true });

        const result = await listTeams.execute({ teamIds: ["team-legal"] });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });

    it("fails with a persistence error, logged once, when the lookup fails other than not found", async () => {
        const { listTeams } = await setup({ failing: true });

        const result = await listTeams.execute({ teamIds: ["team-legal", "team-marketing"] });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(result.isFail() && result.error.message).toBe("Storage is not available.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });
});
```

Create `packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts`. The shared `WorkflowsReviewStep` is only reachable through the CMS and WB roots, which this package does not have, so the test registers a probe field on `WorkflowsQuery` that returns a step with only the ids it was given; the real shared field resolver then runs on the real schema:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Result } from "@webiny/feature/api";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** Has a workflows permission, but not `security.team`, as a reviewer has. */
const REVIEWER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

/**
 * The shared `WorkflowsReviewStep` is only reachable through the app roots, which this package does
 * not have. A probe field returns a step with only the ids the test sends, so the field resolver
 * of `candidateTeams` is exercised on the real shared schema.
 */
class ReviewStepProbeImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            extend type WorkflowsQuery {
                probeReviewStep(candidateTeamIds: [String!]): WorkflowsReviewStep
            }
        `);
        builder.addResolver<ProbeArgs>({
            path: "WorkflowsQuery.probeReviewStep",
            dependencies: [],
            resolver: () => {
                return async ({ args }) => {
                    if (!args.candidateTeamIds) {
                        return { id: "step-1" };
                    }
                    return { id: "step-1", candidateTeamIds: args.candidateTeamIds };
                };
            }
        });
        return builder;
    }
}

interface ProbeArgs {
    candidateTeamIds?: string[] | null;
}

const ReviewStepProbe = GraphQLSchemaFactory.createImplementation({
    implementation: ReviewStepProbeImpl,
    dependencies: []
});

class PluginTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [
            { name: "Legal", slug: "team-legal", description: "Defined in code.", roles: [] },
            {
                name: "Marketing",
                slug: "team-marketing",
                description: "Defined in code.",
                roles: []
            }
        ];
    }
}

/** An unexpected throw out of the use case, as a bug would cause. */
class ThrowingListTeamsImpl implements ListReviewCandidateTeamsUseCase.Interface {
    public constructor(private decoratee: ListReviewCandidateTeamsUseCase.Interface) {}

    public async execute(): ListReviewCandidateTeamsUseCase.Return {
        throw new Error("The use case crashed.");
    }
}

const ThrowingListTeams = ListReviewCandidateTeamsUseCase.createDecorator({
    decorator: ThrowingListTeamsImpl,
    dependencies: []
});

/** The team lookup fails with a storage error. */
class FailingGetTeamImpl implements GetTeamUseCase.Interface {
    public constructor(private decoratee: GetTeamUseCase.Interface) {}

    public async execute(): ReturnType<GetTeamUseCase.Interface["execute"]> {
        return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
    }
}

const FailingGetTeam = GetTeamUseCase.createDecorator({
    decorator: FailingGetTeamImpl,
    dependencies: []
});

const PROBE = /* GraphQL */ `
    query Probe($candidateTeamIds: [String!]) {
        workflows {
            probeReviewStep(candidateTeamIds: $candidateTeamIds) {
                id
                candidateTeamIds
                candidateTeams {
                    id
                    name
                }
            }
        }
    }
`;

/** Without `candidateTeamIds`, so a step the probe sends without ids can be read. */
const PROBE_TEAMS_ONLY = /* GraphQL */ `
    query ProbeTeamsOnly($candidateTeamIds: [String!]) {
        workflows {
            probeReviewStep(candidateTeamIds: $candidateTeamIds) {
                id
                candidateTeams {
                    id
                    name
                }
            }
        }
    }
`;

interface TeamRow {
    id: string;
    name: string;
}

interface StepRow {
    id: string;
    candidateTeamIds: string[];
    candidateTeams: TeamRow[];
}

interface ProbeBody {
    data: { workflows: { probeReviewStep: StepRow } };
    errors?: { message: string }[];
}

interface IntrospectionFieldRow {
    name: string;
}

interface IntrospectionTypeRow {
    name: string;
    fields: IntrospectionFieldRow[] | null;
}

interface IntrospectionBody {
    data: { __schema: { types: IntrospectionTypeRow[] } };
}

interface SetupParams extends CmsTestHandlerParams {
    throwing?: boolean;
    failing?: boolean;
}

const createApi = async (params: SetupParams = {}) => {
    const { createQuery, introspect } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(TeamFactory, new PluginTeamFactory());
            container.register(ReviewStepProbe);
            if (params.throwing) {
                container.registerDecorator(ThrowingListTeams);
            }
            if (params.failing) {
                container.registerDecorator(FailingGetTeam);
            }
        }
    });
    return {
        probe: createQuery<ProbeBody>(PROBE),
        probeTeamsOnly: createQuery<ProbeBody>(PROBE_TEAMS_ONLY),
        introspect
    };
};

describe("WorkflowsReviewStep.candidateTeams (R208, A68, A69)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the team names next to the ids, in the stored order", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ candidateTeamIds: ["team-marketing", "team-legal"] });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeReviewStep).toEqual({
            id: "step-1",
            candidateTeamIds: ["team-marketing", "team-legal"],
            candidateTeams: [
                { id: "team-marketing", name: "Marketing" },
                { id: "team-legal", name: "Legal" }
            ]
        });
    });

    it("gives a viewer without security.team the names", async () => {
        const { probe } = await createApi({ permissions: REVIEWER });

        const [body] = await probe({ candidateTeamIds: ["team-legal"] });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeReviewStep.candidateTeams).toEqual([
            { id: "team-legal", name: "Legal" }
        ]);
    });

    it("omits a team that no longer exists and keeps its id in candidateTeamIds", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ candidateTeamIds: ["team-gone", "team-legal"] });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeReviewStep.candidateTeamIds).toEqual([
            "team-gone",
            "team-legal"
        ]);
        expect(body.data.workflows.probeReviewStep.candidateTeams).toEqual([
            { id: "team-legal", name: "Legal" }
        ]);
        expect(loggedErrors).toEqual([]);
    });

    it("resolves an empty list when the step has no candidate team ids", async () => {
        const { probe, probeTeamsOnly } = await createApi();

        const [withoutIds] = await probeTeamsOnly();
        const [emptyIds] = await probe({ candidateTeamIds: [] });

        expect(withoutIds.errors).toBeUndefined();
        expect(withoutIds.data.workflows.probeReviewStep.candidateTeams).toEqual([]);
        expect(emptyIds.errors).toBeUndefined();
        expect(emptyIds.data.workflows.probeReviewStep.candidateTeams).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("resolves [] and succeeds when the team lookup fails, with one log", async () => {
        const { probe } = await createApi({ failing: true });

        const [body] = await probe({ candidateTeamIds: ["team-legal"] });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeReviewStep.id).toBe("step-1");
        expect(body.data.workflows.probeReviewStep.candidateTeams).toEqual([]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });

    it("resolves [] and succeeds when the use case throws, with one log", async () => {
        const { probe } = await createApi({ throwing: true });

        const [body] = await probe({ candidateTeamIds: ["team-legal"] });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeReviewStep.candidateTeamIds).toEqual(["team-legal"]);
        expect(body.data.workflows.probeReviewStep.candidateTeams).toEqual([]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not resolve the candidate teams of a review step."
        );
    });

    it("exposes only id and name on WorkflowsTeam, and the new field on the step", async () => {
        const { introspect } = await createApi();

        const [body] = await introspect();

        const types = (body as IntrospectionBody).data.__schema.types;
        const team = types.find(type => type.name === "WorkflowsTeam");
        const step = types.find(type => type.name === "WorkflowsReviewStep");
        expect(team?.fields?.map(field => field.name).sort()).toEqual(["id", "name"]);
        expect(step?.fields?.map(field => field.name)).toContain("candidateTeams");
        expect(step?.fields?.map(field => field.name)).toContain("candidateTeamIds");
    });
});
```

Update the two existing assertions. `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`:

```diff
diff --git a/packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts b/packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts
index d8066d09dc..21017c6647 100644
--- a/packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts
+++ b/packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts
@@ -725,8 +725,9 @@ describe("workflows GraphQL root", () => {
             "data",
             "error"
         ]);
         expect(memberNames(types, "WorkflowsUser")).toEqual(["id", "displayName"]);
+        expect(memberNames(types, "WorkflowsTeam")).toEqual(["id", "name"]);
         expect(memberNames(types, "WorkflowsUserListResult")).toEqual(["users", "missingIds"]);
         expect(memberNames(types, "WorkflowsUserListResponse")).toEqual(["data", "error"]);
         expect(memberNames(types, "WorkflowsStepCandidate")).toEqual([
             "id",
@@ -822,8 +823,9 @@ describe("workflows GraphQL root", () => {
             "owner",
             "comment",
             "pickedUserId",
             "candidateTeamIds",
+            "candidateTeams",
             "assignmentSource",
             "assignment",
             "reachedOn",
             "startedOn",
```

`packages/api-workflows/__tests__/registration.test.ts`:

```diff
diff --git a/packages/api-workflows/__tests__/registration.test.ts b/packages/api-workflows/__tests__/registration.test.ts
index ee7d95e746..3dd473f9f4 100644
--- a/packages/api-workflows/__tests__/registration.test.ts
+++ b/packages/api-workflows/__tests__/registration.test.ts
@@ -19,8 +19,9 @@ import { RestartReviewStepUseCase } from "~/features/review/RestartReviewStep/in
 import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
 import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
 import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
 import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
+import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
 import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
 import { ListReviewsUseCase } from "~/features/review/ListReviews/index.js";
 import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
 import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";
@@ -116,8 +117,9 @@ describe("WorkflowsFeature registration", () => {
         expect(container.resolveAll(RejectReviewStepUseCase)).toHaveLength(1);
         expect(container.resolveAll(CancelReviewUseCase)).toHaveLength(1);
         expect(container.resolveAll(GetTargetReviewUseCase)).toHaveLength(1);
         expect(container.resolveAll(ListTargetReviewsUseCase)).toHaveLength(1);
+        expect(container.resolveAll(ListReviewCandidateTeamsUseCase)).toHaveLength(1);
         expect(container.resolveAll(ListReviewsUseCase)).toHaveLength(1);
         expect(container.resolveAll(ReviewListLimits)).toHaveLength(1);
         expect(container.resolveAll(DeleteTargetReviewsUseCase)).toHaveLength(1);
         expect(container.resolveAll(CancelTargetReviewsUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
```

Expected: FAIL. The unit test and the registration test cannot resolve `~/features/review/ListReviewCandidateTeams/index.js`; the GraphQL test fails with `Unknown type "WorkflowsTeam"` or `Cannot query field "candidateTeams"` (schema build); the schema test misses `WorkflowsTeam` and `candidateTeams`.

- [ ] **Step 3: Implement**

`packages/api-workflows/src/features/review/ListReviewCandidateTeams/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ReviewCandidateTeam {
    id: string;
    name: string;
}

export interface ListReviewCandidateTeamsInput {
    /** The `candidateTeamIds` of one review step. */
    teamIds: string[];
}

export interface IListReviewCandidateTeamsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError =
    IListReviewCandidateTeamsUseCaseErrors[keyof IListReviewCandidateTeamsUseCaseErrors];

export interface IListReviewCandidateTeamsUseCase {
    execute(
        input: ListReviewCandidateTeamsInput
    ): Promise<Result<ReviewCandidateTeam[], UseCaseError>>;
}

/**
 * The names of a step's candidate teams (R208). Internal (D132): no permission check of its own,
 * the field resolver of `WorkflowsReviewStep.candidateTeams` runs after the wrappers authorized
 * the read. Only the team lookup runs without authorization, because `GetTeamUseCase` needs
 * `security.team`; the result carries `id` and `name` and nothing else. An unknown team is left
 * out.
 */
export const ListReviewCandidateTeamsUseCase = createAbstraction<IListReviewCandidateTeamsUseCase>(
    "ListReviewCandidateTeamsUseCase"
);

export namespace ListReviewCandidateTeamsUseCase {
    export type Interface = IListReviewCandidateTeamsUseCase;
    export type Input = ListReviewCandidateTeamsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewCandidateTeam[], UseCaseError>>;
}
```

`packages/api-workflows/src/features/review/ListReviewCandidateTeams/ListReviewCandidateTeamsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { TeamNotFoundError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ListReviewCandidateTeamsUseCase as UseCase } from "./abstractions.js";
import type { ReviewCandidateTeam } from "./abstractions.js";

interface TeamLookup {
    teamId: string;
    result: Result<Team, GetTeamUseCase.Error>;
}

class ListReviewCandidateTeamsUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getTeam: GetTeamUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const teamIds = [...new Set(input.teamIds)];
        if (teamIds.length === 0) {
            return Result.ok([]);
        }

        // `GetTeamUseCase` needs `security.team`, which a reviewer does not have. A name lookup is
        // not an access decision, so only these lookups run without authorization (R208).
        let lookups: TeamLookup[];
        try {
            lookups = await this.identityContext.withoutAuthorization(async () => {
                const found: TeamLookup[] = [];
                for (const teamId of teamIds) {
                    found.push({ teamId, result: await this.getTeam.execute({ id: teamId }) });
                }
                return found;
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            this.logger.error(
                { error: cause, teamIds },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(cause));
        }

        const teams: ReviewCandidateTeam[] = [];
        for (const lookup of lookups) {
            if (lookup.result.isOk()) {
                const { id, name } = lookup.result.value;
                teams.push({ id, name });
                continue;
            }
            // A deleted team is left out; the step still keeps its id in `candidateTeamIds`.
            if (lookup.result.error instanceof TeamNotFoundError) {
                continue;
            }
            this.logger.error(
                { error: lookup.result.error, teamId: lookup.teamId },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(lookup.result.error));
        }
        return Result.ok(teams);
    }
}

export const ListReviewCandidateTeamsUseCase = UseCase.createImplementation({
    implementation: ListReviewCandidateTeamsUseCaseImpl,
    dependencies: [IdentityContext, GetTeamUseCase, Logger]
});
```

`packages/api-workflows/src/features/review/ListReviewCandidateTeams/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListReviewCandidateTeamsUseCase } from "./ListReviewCandidateTeamsUseCase.js";

export const ListReviewCandidateTeamsFeature = createFeature({
    name: "Workflows/ListReviewCandidateTeams",
    register(container) {
        container.register(ListReviewCandidateTeamsUseCase);
    }
});
```

`packages/api-workflows/src/features/review/ListReviewCandidateTeams/index.ts`:

```ts
export { ListReviewCandidateTeamsUseCase } from "./abstractions.js";
export type { ListReviewCandidateTeamsInput, ReviewCandidateTeam } from "./abstractions.js";
```

`packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` (the type, the field and the resolver; the rest of the file is unchanged):

```diff
diff --git a/packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts b/packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
index 25add7aeaa..019c6191ae 100644
--- a/packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
+++ b/packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
@@ -6,8 +6,10 @@ import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomati
 import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";
 import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";
 import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
 import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
+import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
+import { Logger } from "@webiny/api-core/features/logger/index.js";
 import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
 
 interface GetSettingsArgs {
     includeExpired?: boolean | null;
@@ -26,8 +28,16 @@ interface SettingsInputArgs {
 interface UpdateSettingsArgs {
     data: SettingsInputArgs;
 }
 
+interface CandidateTeamsParent {
+    candidateTeamIds?: string[] | null;
+}
+
+interface CandidateTeamsResolverArgs {
+    parent: CandidateTeamsParent;
+}
+
 interface ListUsersArgs {
     search?: string | null;
     ids?: string[] | null;
     limit?: number | null;
@@ -81,8 +91,14 @@ const SHARED_TYPE_DEFS = /* GraphQL */ `
         id: ID!
         displayName: String!
     }
 
+    "A team as the review screens name one (R208): id and name only."
+    type WorkflowsTeam {
+        id: ID!
+        name: String!
+    }
+
     "A member of a step's teams (R120). excludedReason is null unless the viewer has editor or reassign (D97)."
     type WorkflowsStepCandidate {
         id: ID!
         displayName: String!
@@ -237,8 +253,10 @@ const SHARED_TYPE_DEFS = /* GraphQL */ `
         owner: WorkflowsActor
         comment: String
         pickedUserId: String
         candidateTeamIds: [String!]!
+        "The candidate teams by name (R208). A team that no longer exists is left out; an empty list when the names could not be read."
+        candidateTeams: [WorkflowsTeam!]!
         assignmentSource: String
         assignment: WorkflowsReviewStepAssignment
         reachedOn: DateTime
         startedOn: DateTime
@@ -473,8 +491,37 @@ class WorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
     public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
         builder.addTypeDefs(SHARED_TYPE_DEFS);
         builder.addTypeDefs(ROOT_TYPE_DEFS);
 
+        // Never fails the read: a review is readable without the team names (R87, R208).
+        builder.addResolver({
+            path: "WorkflowsReviewStep.candidateTeams",
+            dependencies: [ListReviewCandidateTeamsUseCase, Logger],
+            resolver: (
+                listTeams: ListReviewCandidateTeamsUseCase.Interface,
+                logger: Logger.Interface
+            ) => {
+                return async ({ parent }: CandidateTeamsResolverArgs) => {
+                    try {
+                        const result = await listTeams.execute({
+                            teamIds: parent.candidateTeamIds ?? []
+                        });
+                        if (result.isFail()) {
+                            // The use case logged the failure.
+                            return [];
+                        }
+                        return result.value;
+                    } catch (error) {
+                        logger.error(
+                            { error },
+                            "Could not resolve the candidate teams of a review step."
+                        );
+                        return [];
+                    }
+                };
+            }
+        });
+
         builder.addResolver({
             path: "Query.workflows",
             dependencies: [],
             resolver: () => () => ({})
```

`packages/api-workflows/src/WorkflowsFeature.ts`:

```diff
diff --git a/packages/api-workflows/src/WorkflowsFeature.ts b/packages/api-workflows/src/WorkflowsFeature.ts
index 16ac0a9ef9..83234c20b5 100644
--- a/packages/api-workflows/src/WorkflowsFeature.ts
+++ b/packages/api-workflows/src/WorkflowsFeature.ts
@@ -25,8 +25,9 @@ import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/fe
 import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
 import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
 import { GetTargetReviewFeature } from "~/features/review/GetTargetReview/feature.js";
 import { ListTargetReviewsFeature } from "~/features/review/ListTargetReviews/feature.js";
+import { ListReviewCandidateTeamsFeature } from "~/features/review/ListReviewCandidateTeams/feature.js";
 import { ListReviewsFeature } from "~/features/review/ListReviews/feature.js";
 import { CancelTargetReviewsFeature } from "~/features/review/CancelTargetReviews/feature.js";
 import { DeleteTargetReviewsFeature } from "~/features/review/DeleteTargetReviews/feature.js";
 import { GetBoundWorkflowFeature } from "~/features/workflow/GetBoundWorkflow/feature.js";
@@ -119,8 +120,10 @@ export const WorkflowsFeature = createFeature({
 
         // Target queries for the app target adapters and wrappers
         GetTargetReviewFeature.register(container);
         ListTargetReviewsFeature.register(container);
+        // Team names of a review step's candidate teams (R208)
+        ListReviewCandidateTeamsFeature.register(container);
         // Review lists for the app wrappers (spec 11)
         ListReviewsFeature.register(container);
         DeleteTargetReviewsFeature.register(container);
         CancelTargetReviewsFeature.register(container);
```

- [ ] **Step 4: Run the new tests on both storages, expect pass**

Run one command at a time (parallel `test:os` runs clash on port 8001):

```bash
yarn test packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts 2>&1 | tail -50
```

Expected: PASS (8 and 7 tests).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-workflows): name the candidate teams of a review step" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
