import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { LogInRepository } from "~/features/security/LogIn/abstractions.js";
import { AssumePermissionsContext } from "~/features/assumePermissions/abstractions.js";
import { AssumePermissionsUseCase as UseCaseAbstraction } from "~/features/assumePermissions/abstractions.js";
import { AssumePermissionsUseCase } from "~/features/assumePermissions/AssumePermissionsUseCase.js";

const identity = Identity.createAuthenticated({
    id: "u1",
    displayName: "Admin",
    type: "admin",
    roles: [],
    teams: [],
    permissions: [{ name: "*" }],
    profile: { external: false },
    currentTenant: { id: "root", name: "Root" },
    defaultTenant: { id: "root", name: "Root" }
});

const setup = (stored: AssumePermissionsContext.Value | null) => {
    let value = stored;
    const container = new Container();

    container.register(IdentityContextImpl).inSingletonScope();
    container.resolve(IdentityContext).setIdentity(identity);

    container.registerInstance(AssumePermissionsContext, {
        get: () => value,
        set: next => {
            value = next;
        }
    });
    container.registerInstance(LogInRepository, {
        login: async () => identity
    });
    container.register(AssumePermissionsUseCase);

    return {
        useCase: container.resolve(UseCaseAbstraction),
        stored: () => value
    };
};

describe("AssumePermissionsUseCase", () => {
    it("stores where the preview was started from", async () => {
        const { useCase, stored } = setup(null);

        await useCase.execute(
            { type: "role", id: "editor", name: "Editor" },
            { returnTo: "/access-management/roles?id=editor" }
        );

        expect(stored()?.returnTo).toBe("/access-management/roles?id=editor");
    });

    it("keeps the first starting point when switching to another role", async () => {
        const { useCase, stored } = setup({
            type: "role",
            id: "editor",
            name: "Editor",
            startedBy: "u1",
            returnTo: "/access-management/roles?id=editor"
        });

        await useCase.execute({ type: "role", id: "reviewer", name: "Reviewer" }, {});

        expect(stored()?.id).toBe("reviewer");
        expect(stored()?.returnTo).toBe("/access-management/roles?id=editor");
    });

    it("leaves the starting point out when there is none", async () => {
        const { useCase, stored } = setup(null);

        await useCase.execute({ type: "team", id: "editors", name: "Editors" });

        expect(stored()).not.toHaveProperty("returnTo");
    });
});
