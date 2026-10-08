import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { LogInUseCase } from "~/features/security/LogIn/abstractions.js";
import { LogOutUseCase } from "~/features/security/LogOut/abstractions.js";
import { AssumePermissionsContext } from "~/features/assumePermissions/abstractions.js";
import { LogInUseCaseDecorator } from "~/features/assumePermissions/LogInUseCaseDecorator.js";
import { LogOutUseCaseDecorator } from "~/features/assumePermissions/LogOutUseCaseDecorator.js";

interface SetupOptions {
    stored: AssumePermissionsContext.Value | null;
    // Who the login signs in as.
    loginAs?: string;
    // The login fails whenever a preview is stored, as it does for a role that no longer resolves.
    failWithAssumedPermissions?: boolean;
}

const identityFor = (id: string) => {
    return Identity.createAuthenticated({
        id,
        displayName: id,
        type: "admin",
        roles: [],
        teams: [],
        permissions: [{ name: "*" }],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
};

const setup = (options: SetupOptions) => {
    const { loginAs = "u1", failWithAssumedPermissions = false } = options;
    const logins: string[] = [];
    let stored = options.stored;
    const container = new Container();

    container.register(IdentityContextImpl).inSingletonScope();
    const identityContext = container.resolve(IdentityContext);

    container.registerInstance(AssumePermissionsContext, {
        get: () => stored,
        set: value => {
            stored = value;
        }
    });

    container.registerInstance(LogInUseCase, {
        execute: async () => {
            logins.push(stored ? "with preview" : "without preview");

            if (stored && failWithAssumedPermissions) {
                throw new Error("You have no permissions on this tenant!");
            }

            const identity = identityFor(loginAs);
            identityContext.setIdentity(identity);
        }
    });
    container.registerDecorator(LogInUseCaseDecorator);

    const logIn = container.resolve(LogInUseCase);
    const params = { idTokenProvider: async () => "token" } as LogInUseCase.Params;

    return {
        login: () => logIn.execute(params),
        logins,
        stored: () => stored
    };
};

const preview = (startedBy: string): AssumePermissionsContext.Value => {
    return { type: "role", id: "editor", name: "Editor", startedBy };
};

describe("LogInUseCaseDecorator", () => {
    it("logs in once when nothing is being previewed", async () => {
        const { login, logins } = setup({ stored: null });

        await login();

        expect(logins).toEqual(["without preview"]);
    });

    it("keeps a preview the signed-in user started", async () => {
        const { login, logins, stored } = setup({ stored: preview("u1"), loginAs: "u1" });

        await login();

        expect(logins).toEqual(["with preview"]);
        expect(stored()).not.toBeNull();
    });

    // A session that ended without logging out leaves the last user's preview behind.
    it("drops a preview someone else started, and logs in again as the user", async () => {
        const { login, logins, stored } = setup({ stored: preview("u1"), loginAs: "u2" });

        await login();

        expect(logins).toEqual(["with preview", "without preview"]);
        expect(stored()).toBeNull();
    });

    // A deleted role, or one from another tenant, grants nothing, and such a login throws.
    it("drops a preview whose login fails, instead of stranding the user", async () => {
        const { login, logins, stored } = setup({
            stored: preview("u1"),
            failWithAssumedPermissions: true
        });

        await login();

        expect(logins).toEqual(["with preview", "without preview"]);
        expect(stored()).toBeNull();
    });

    it("lets a failure unrelated to a preview through", async () => {
        const container = new Container();
        container.registerInstance(AssumePermissionsContext, {
            get: () => null,
            set: () => undefined
        });
        container.register(IdentityContextImpl).inSingletonScope();
        container.registerInstance(LogInUseCase, {
            execute: async () => {
                throw new Error("Network down");
            }
        });
        container.registerDecorator(LogInUseCaseDecorator);

        const logIn = container.resolve(LogInUseCase);
        const params = { idTokenProvider: async () => "token" } as LogInUseCase.Params;

        await expect(logIn.execute(params)).rejects.toThrow("Network down");
    });
});

describe("LogOutUseCaseDecorator", () => {
    it("clears the preview before logging out", async () => {
        let stored: AssumePermissionsContext.Value | null = preview("u1");
        let storedAtLogout: AssumePermissionsContext.Value | null | undefined;
        const container = new Container();

        container.registerInstance(AssumePermissionsContext, {
            get: () => stored,
            set: value => {
                stored = value;
            }
        });
        container.registerInstance(LogOutUseCase, {
            execute: async () => {
                storedAtLogout = stored;
            }
        });
        container.registerDecorator(LogOutUseCaseDecorator);

        const logOut = container.resolve(LogOutUseCase);
        await logOut.execute();

        expect(storedAtLogout).toBeNull();
    });
});
