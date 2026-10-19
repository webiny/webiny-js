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
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Storage is not available."
        );
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });
});
