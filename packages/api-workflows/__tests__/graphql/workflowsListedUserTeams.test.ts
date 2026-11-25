import { beforeEach, describe, expect, it } from "vitest";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";

interface ProbeUser {
    id: string;
    teamIds: string[];
}

interface ProbeStep {
    id: string;
    type: string;
    config: unknown;
}

const USERS: ProbeUser[] = [
    { id: "user-1", teamIds: ["team-marketing", "team-legal"] },
    { id: "user-2", teamIds: ["team-legal"] },
    { id: "user-3", teamIds: [] },
    { id: "user-4", teamIds: ["team-gone", "team-marketing"] }
];

const reviewConfig = (teams: string[]) => ({
    teams,
    assignment: { strategy: "none", allowManualPick: false, rules: [] }
});

const STEPS: ProbeStep[] = [
    { id: "s1", type: "review", config: reviewConfig(["team-marketing", "team-legal"]) },
    { id: "s2", type: "review", config: reviewConfig(["team-gone", "team-legal"]) },
    { id: "s3", type: "review", config: { teams: "nope" } },
    { id: "s4", type: "automation", config: reviewConfig(["team-legal"]) },
    { id: "s5", type: "review", config: null }
];

/**
 * The shared `WorkflowsListedUser` and `WorkflowsStep` types are only reachable through the app
 * roots, which this package does not have. Probe fields return rows with only the data the
 * resolvers read, so the field resolvers run on the real shared schema.
 */
class ProbeImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            extend type WorkflowsQuery {
                probeUsers: [WorkflowsListedUser!]!
                probeSteps: [WorkflowsStep!]!
            }
        `);
        builder.addResolver({
            path: "WorkflowsQuery.probeUsers",
            dependencies: [],
            resolver: () => {
                return async () => USERS.map(user => ({ ...user, displayName: user.id }));
            }
        });
        builder.addResolver({
            path: "WorkflowsQuery.probeSteps",
            dependencies: [],
            resolver: () => {
                return async () => {
                    return STEPS.map(step => ({
                        ...step,
                        title: step.id,
                        color: "blue",
                        notifications: []
                    }));
                };
            }
        });
        return builder;
    }
}

const Probe = GraphQLSchemaFactory.createImplementation({
    implementation: ProbeImpl,
    dependencies: []
});

class PluginTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [
            { name: "Marketing", slug: "team-marketing", description: "In code.", roles: [] },
            { name: "Legal", slug: "team-legal", description: "In code.", roles: [] }
        ];
    }
}

const listCalls: unknown[] = [];

class CountingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(
        ...args: Parameters<ListTeamsUseCase.Interface["execute"]>
    ): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        listCalls.push(args[0]);
        return this.decoratee.execute(...args);
    }
}

const CountingListTeams = ListTeamsUseCase.createDecorator({
    decorator: CountingListTeamsImpl,
    dependencies: []
});

const USERS_QUERY = /* GraphQL */ `
    query ProbeUsers {
        workflows {
            probeUsers {
                id
                teams {
                    id
                    name
                }
            }
        }
    }
`;

const STEPS_QUERY = /* GraphQL */ `
    query ProbeSteps {
        workflows {
            probeSteps {
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

interface UsersBody {
    data: { workflows: { probeUsers: { id: string; teams: TeamRow[] }[] } };
    errors?: { message: string }[];
}

interface StepsBody {
    data: { workflows: { probeSteps: { id: string; candidateTeams: TeamRow[] }[] } };
    errors?: { message: string }[];
}

const createApi = async () => {
    const { createQuery } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(TeamFactory, new PluginTeamFactory());
            container.register(Probe);
            container.registerDecorator(CountingListTeams);
        }
    });
    return {
        users: createQuery<UsersBody>(USERS_QUERY),
        steps: createQuery<StepsBody>(STEPS_QUERY)
    };
};

describe("WorkflowsListedUser.teams (D170)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        listCalls.length = 0;
    });

    it("resolves the teams of every row sorted by name, with one team list call", async () => {
        const { users } = await createApi();

        const [body] = await users();

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeUsers).toEqual([
            {
                id: "user-1",
                teams: [
                    { id: "team-legal", name: "Legal" },
                    { id: "team-marketing", name: "Marketing" }
                ]
            },
            { id: "user-2", teams: [{ id: "team-legal", name: "Legal" }] },
            { id: "user-3", teams: [] },
            { id: "user-4", teams: [{ id: "team-marketing", name: "Marketing" }] }
        ]);
        expect(listCalls).toHaveLength(1);
        expect(loggedErrors).toEqual([]);
    });
});

describe("WorkflowsStep.candidateTeams (R208)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        listCalls.length = 0;
    });

    it("names the teams of review steps in the step's order, [] for the rest", async () => {
        const { steps } = await createApi();

        const [body] = await steps();

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeSteps).toEqual([
            {
                id: "s1",
                candidateTeams: [
                    { id: "team-marketing", name: "Marketing" },
                    { id: "team-legal", name: "Legal" }
                ]
            },
            { id: "s2", candidateTeams: [{ id: "team-legal", name: "Legal" }] },
            { id: "s3", candidateTeams: [] },
            { id: "s4", candidateTeams: [] },
            { id: "s5", candidateTeams: [] }
        ]);
        expect(listCalls).toHaveLength(1);
    });
});
