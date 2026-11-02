import { beforeEach } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Result } from "@webiny/feature/api";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
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
    teamIds: string[];
    authorizationEnabled: boolean;
}

/** Every `ListTeamsUseCase.execute` call, with the authorization state it ran in. */
const teamLookups: TeamLookupCall[] = [];

class RecordingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: ListTeamsUseCase.Interface
    ) {}

    public async execute(params?: ListTeamsInput) {
        teamLookups.push({
            teamIds: params?.where?.id_in ?? [],
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        return this.decoratee.execute(params);
    }
}

const RecordingListTeams = ListTeamsUseCase.createDecorator({
    decorator: RecordingListTeamsImpl,
    dependencies: [IdentityContext]
});

/** The lookup crashes, as a broken storage driver does. */
class ThrowingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        throw new Error("Teams are down.");
    }
}

const ThrowingListTeams = ListTeamsUseCase.createDecorator({
    decorator: ThrowingListTeamsImpl,
    dependencies: []
});

/** The lookup returns a failed Result. */
class FailingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
    }
}

const FailingListTeams = ListTeamsUseCase.createDecorator({
    decorator: FailingListTeamsImpl,
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
            container.registerDecorator(RecordingListTeams);
            if (params.throwing) {
                container.registerDecorator(ThrowingListTeams);
            }
            if (params.failing) {
                container.registerDecorator(FailingListTeams);
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
        expect(teamLookups.map(lookup => lookup.teamIds)).toEqual([
            ["team-marketing", "team-legal"]
        ]);
    });

    it("reads the teams of concurrent calls with one list and keeps them for the request (Q79)", async () => {
        const { listTeams } = await setup();

        const [first, second] = await Promise.all([
            listTeams.execute({ teamIds: ["team-legal"] }),
            listTeams.execute({ teamIds: ["team-marketing", "team-legal"] })
        ]);
        const again = await listTeams.execute({ teamIds: ["team-marketing"] });

        expect(expectOk(first)).toEqual([{ id: "team-legal", name: "Legal" }]);
        expect(expectOk(second)).toEqual([
            { id: "team-marketing", name: "Marketing" },
            { id: "team-legal", name: "Legal" }
        ]);
        expect(expectOk(again)).toEqual([{ id: "team-marketing", name: "Marketing" }]);
        expect(teamLookups.map(lookup => lookup.teamIds)).toEqual([
            ["team-legal", "team-marketing"]
        ]);
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
            { teamIds: ["team-legal", "team-marketing"], authorizationEnabled: false }
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

    it("fails with a persistence error, logged once, when the lookup fails", async () => {
        const { listTeams } = await setup({ failing: true });

        const result = await listTeams.execute({ teamIds: ["team-legal", "team-marketing"] });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Storage is not available."
        );
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });
});
