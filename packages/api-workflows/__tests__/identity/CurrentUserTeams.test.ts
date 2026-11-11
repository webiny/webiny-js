import { describe, expect, it } from "vitest";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTeam, FakeListUserTeams } from "~tests/__helpers/FakeListUserTeams.js";
import { OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";
const SECOND_USER_ID = "user-second";

const createFake = (): FakeListUserTeams => {
    return new FakeListUserTeams(
        new Map([
            [DEFAULT_USER_ID, [createTeam(REVIEW_TEAM_ID), createTeam(OTHER_TEAM_ID)]],
            [SECOND_USER_ID, [createTeam(OTHER_TEAM_ID)]]
        ])
    );
};

const createTeamsContext = async (fake: FakeListUserTeams) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUserTeamsUseCase, fake);
        }
    });
    return {
        container: context.container,
        teams: context.container.resolve(CurrentUserTeams)
    };
};

describe("CurrentUserTeams", () => {
    it("returns the team ids of the current identity", async () => {
        const fake = createFake();
        const { teams } = await createTeamsContext(fake);

        expect(await teams.getTeamIds()).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID]);
    });

    it("looks the teams up once per request and identity", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);

        await teams.getTeamIds();
        await teams.getTeamIds();
        await container.resolve(CurrentUserTeams).getTeamIds();

        expect(fake.calls).toEqual([DEFAULT_USER_ID]);
    });

    it("keys the cache by identity", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);
        const identityContext = container.resolve(IdentityContext);
        const second = new AuthenticatedIdentity({
            id: SECOND_USER_ID,
            displayName: "Second User",
            type: "admin"
        });

        const defaultTeams = await teams.getTeamIds();
        const secondTeams = await identityContext.withIdentity(second, () => teams.getTeamIds());
        const defaultAgain = await teams.getTeamIds();

        expect(defaultTeams).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(secondTeams).toEqual([OTHER_TEAM_ID]);
        expect(defaultAgain).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID, SECOND_USER_ID]);
    });

    it("keys the cache by tenant", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);
        const tenantContext = container.resolve(TenantContext);
        const other = { ...tenantContext.getTenant(), id: "other-tenant", name: "Other" };

        await teams.getTeamIds();
        await tenantContext.withTenant(other, () => teams.getTeamIds());
        await teams.getTeamIds();

        // One lookup per tenant: the other tenant's teams are never served from the first one.
        expect(fake.calls).toEqual([DEFAULT_USER_ID, DEFAULT_USER_ID]);
    });

    it("returns no teams for a failed lookup and does not cache it", async () => {
        const fake = createFake();
        fake.failuresLeft = 1;
        const { teams } = await createTeamsContext(fake);

        expect(await teams.getTeamIds()).toEqual([]);
        expect(await teams.getTeamIds()).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID, DEFAULT_USER_ID]);
    });

    it("returns no teams for an anonymous identity without a lookup", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            teams.getTeamIds()
        );

        expect(result).toEqual([]);
        expect(fake.calls).toEqual([]);
    });

    it("returns no teams when the identity has no admin user record", async () => {
        // Real `ListUserTeamsUseCase`: the default test identity has no admin user record.
        const { context } = await createContextHandler();

        expect(await context.container.resolve(CurrentUserTeams).getTeamIds()).toEqual([]);
    });
});
