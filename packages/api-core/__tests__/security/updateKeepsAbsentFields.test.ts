import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { UpdateRoleUseCase as UpdateRoleAbstraction } from "~/features/security/roles/UpdateRole/abstractions.js";
import { UpdateRoleUseCase } from "~/features/security/roles/UpdateRole/UpdateRoleUseCase.js";
import { UpdateTeam } from "~/features/security/teams/UpdateTeam/abstractions.js";
import { UpdateTeamUseCaseImpl } from "~/features/security/teams/UpdateTeam/UpdateTeamUseCase.js";
import type { Role } from "~/types/security.js";
import type { Team } from "~/types/security.js";

const storedRole: Role = {
    id: "role-1",
    name: "Editor",
    slug: "editor",
    description: "Edits content",
    system: false,
    createdOn: null,
    createdBy: null,
    permissions: [{ name: "cms.*" }]
};

const storedTeam = {
    id: "team-1",
    name: "Marketing",
    slug: "marketing",
    description: "Writes the blog",
    roles: ["role-1"],
    system: false
} as unknown as Team;

/*
 * In-process callers, such as the assistant's tools, can hand the use case a key whose value is
 * `undefined`. Zod keeps that key in the parsed output, and the use case spreads the parsed input onto
 * the stored entity, so before `definedOnly` the field was overwritten with `undefined`. GraphQL
 * callers never hit this: JSON has no `undefined`.
 */
const setup = () => {
    const saved: { role?: Role; team?: Team } = {};
    const container = new Container();

    container.registerInstance(IdentityContext, {
        getPermission: async () => ({ name: "*" })
    } as unknown as IdentityContext.Interface);
    container.registerInstance(EventPublisher, {
        publish: async () => undefined
    } as unknown as EventPublisher.Interface);
    container.registerInstance(RolesRepository, {
        get: async () => Result.ok(storedRole),
        update: async (role: Role) => {
            saved.role = role;
            return Result.ok();
        }
    } as unknown as RolesRepository.Interface);
    container.registerInstance(TeamsRepository, {
        get: async () => Result.ok(storedTeam),
        update: async (team: Team) => {
            saved.team = team;
            return Result.ok();
        }
    } as unknown as TeamsRepository.Interface);
    container.register(UpdateRoleUseCase);
    container.register(UpdateTeamUseCaseImpl);

    return { container, saved };
};

describe("update use cases keep fields the caller left undefined", () => {
    it("UpdateRoleUseCase keeps the stored name and permissions", async () => {
        const { container, saved } = setup();

        const result = await container.resolve(UpdateRoleAbstraction).execute("role-1", {
            name: undefined,
            permissions: undefined,
            description: "Edits and reviews content"
        });

        expect(result.isOk()).toBe(true);
        expect(saved.role).toMatchObject({
            name: "Editor",
            permissions: [{ name: "cms.*" }],
            description: "Edits and reviews content"
        });
    });

    it("UpdateTeam keeps the stored name and roles", async () => {
        const { container, saved } = setup();

        const result = await container.resolve(UpdateTeam).execute("team-1", {
            name: undefined,
            roles: undefined,
            description: "Writes the blog and the newsletter"
        });

        expect(result.isOk()).toBe(true);
        expect(saved.team).toMatchObject({
            name: "Marketing",
            roles: ["role-1"],
            description: "Writes the blog and the newsletter"
        });
    });
});
