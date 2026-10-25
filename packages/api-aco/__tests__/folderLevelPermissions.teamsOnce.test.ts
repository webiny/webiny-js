import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { createIdentity } from "@webiny/api-core-testing";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { FolderLevelPermissions as FolderLevelPermissionsAbstraction } from "~/features/flp/FolderLevelPermissions/abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/FolderLevelPermissions.js";
import { GetFlpUseCase } from "~/features/flp/GetFlp/index.js";
import { ListFlpsUseCase } from "~/features/flp/ListFlps/index.js";
import type { FolderLevelPermission } from "~/types.js";

const identity = createIdentity({ id: "user-1", type: "admin", displayName: "User 1" });

const EDITORS = { id: "team-1", slug: "editors", name: "Editors" } as unknown as Team;

const createFlp = (id: string): FolderLevelPermission => {
    return {
        id,
        type: "cms:article",
        parentId: "root",
        slug: id,
        path: `root/${id}`,
        permissions: [{ target: "team:editors", level: "viewer" }]
    } as unknown as FolderLevelPermission;
};

const setup = (teamsEnabled: boolean) => {
    const container = new Container();
    const teamLoads: string[] = [];
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        listPermissions: async () => [],
        isAuthorizationEnabled: () => true
    } as unknown as IdentityContext.Interface);
    container.registerInstance(FeatureFlags, {
        get: () => ({
            isEnabled: (flag: string) => teamsEnabled && flag === "advancedAccessControlLayer.teams"
        })
    } as unknown as FeatureFlags.Interface);
    container.registerInstance(ListUserTeamsUseCase, {
        execute: async (identityId: string) => {
            teamLoads.push(identityId);
            return Result.ok([EDITORS]);
        }
    } as unknown as ListUserTeamsUseCase.Interface);
    container.registerInstance(GetFlpUseCase, {
        execute: async () => null
    } as unknown as GetFlpUseCase.Interface);
    container.registerInstance(ListFlpsUseCase, {
        execute: async () => [createFlp("folder-1"), createFlp("folder-2"), createFlp("folder-3")]
    });
    container.register(FolderLevelPermissions);
    return { flp: container.resolve(FolderLevelPermissionsAbstraction), teamLoads };
};

describe("FolderLevelPermissions with teams", () => {
    it("loads the identity's teams once per list call and grants each folder the team level", async () => {
        const { flp, teamLoads } = setup(true);

        const listed = await flp.listFolderLevelPermissions({ where: { type: "cms:article" } });

        expect(teamLoads).toEqual(["user-1"]);
        expect(listed.map(item => item.id)).toEqual(["folder-1", "folder-2", "folder-3"]);
        for (const item of listed) {
            expect(item.permissions).toContainEqual(
                expect.objectContaining({
                    target: "admin:user-1",
                    level: "viewer",
                    inheritedFrom: "team:editors"
                })
            );
        }
    });

    it("loads the teams again on the next call: nothing is kept between calls", async () => {
        const { flp, teamLoads } = setup(true);

        await flp.listFolderLevelPermissions({ where: { type: "cms:article" } });
        await flp.listFolderLevelPermissions({ where: { type: "cms:article" } });
        await flp.getDefaultPermissions([]);

        expect(teamLoads).toEqual(["user-1", "user-1", "user-1"]);
    });

    it("loads no teams when teams are off", async () => {
        const { flp, teamLoads } = setup(false);

        await flp.listFolderLevelPermissions({ where: { type: "cms:article" } });

        expect(teamLoads).toEqual([]);
    });
});
