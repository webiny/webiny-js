import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js";
import { CreateAndInstallTenantUseCase } from "~/api/features/CreateAndInstallTenant/abstractions.js";
import CreateAndInstallTenantUseCaseImpl from "~/api/features/CreateAndInstallTenant/CreateAndInstallTenantUseCase.js";
import { GetTenantByIdUseCase } from "~/api/features/GetTenantById/abstractions.js";
import { UpdateTenantUseCase } from "~/api/features/UpdateTenant/abstractions.js";
import TenantAccessImpl from "~/api/features/TenantAccess/TenantAccess.js";
import { Tenant } from "~/shared/Tenant.js";

const tenantEntry = Tenant.from({
    id: "acme",
    values: {
        name: "Acme",
        description: "",
        isInstalled: false,
        status: "disabled",
        extensions: {}
    }
});

describe("Tenant manager: installing a tenant", () => {
    it("runs the app installers without authorization, after checking the caller", async () => {
        let authorizationEnabled = true;
        const installCalls: boolean[] = [];

        const identityContext = {
            getPermission: async (name: string) => (name === "tm.tenant" ? { name } : null),
            isAuthorizationEnabled: () => authorizationEnabled,
            withoutAuthorization: async <T>(cb: () => Promise<T>) => {
                authorizationEnabled = false;
                try {
                    return await cb();
                } finally {
                    authorizationEnabled = true;
                }
            }
        };

        const container = new Container();
        container.registerInstance(IdentityContext, identityContext as any);
        container.registerInstance(Tenancy.TenantContext, {
            getTenant: () => ({ id: "root" })
        } as any);
        container.registerInstance(GetModelUseCase, {
            execute: async () => Result.ok({ modelId: "tenant" })
        } as any);
        container.registerInstance(GetEntryByIdUseCase, {
            execute: async () => Result.ok({ id: "acme#0001" })
        } as any);
        container.registerInstance(GetTenantByIdUseCase, {
            execute: async () => Result.ok(tenantEntry)
        } as any);
        container.registerInstance(UpdateTenantUseCase, {
            execute: async () => Result.ok(tenantEntry)
        } as any);
        container.registerInstance(Tenancy.GetTenantByIdUseCase, {
            execute: async () => Result.fail(new Error("not found"))
        } as any);
        container.registerInstance(Tenancy.CreateTenantUseCase, {
            execute: async () => Result.ok({ id: "acme", name: "Acme", parent: "root" })
        } as any);
        container.registerInstance(Tenancy.UpdateTenantUseCase, {} as any);
        container.registerInstance(Tenancy.DeleteTenantUseCase, {
            execute: async () => true
        } as any);
        container.registerInstance(Tenancy.InstallTenantUseCase, {
            execute: async () => {
                installCalls.push(identityContext.isAuthorizationEnabled());
                return Result.ok();
            }
        } as any);
        container.register(TenantAccessImpl);
        container.register(CreateAndInstallTenantUseCaseImpl);

        const result = await container.resolve(CreateAndInstallTenantUseCase).execute("acme");

        expect(result.isOk()).toBe(true);
        expect(installCalls).toEqual([false]);
        expect(authorizationEnabled).toBe(true);
    });
});
