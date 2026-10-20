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
