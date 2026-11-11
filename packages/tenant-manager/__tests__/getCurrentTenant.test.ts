import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";
import { GetTenantByIdUseCase } from "~/api/features/GetTenantById/abstractions.js";
import { GetCurrentTenantUseCase } from "~/api/features/GetCurrentTenant/abstractions.js";
import GetCurrentTenantUseCaseImpl from "~/api/features/GetCurrentTenant/GetCurrentTenantUseCase.js";
import { Tenant } from "~/shared/Tenant.js";

const tenant = Tenant.from({
    id: "acme",
    values: {
        name: "Acme",
        description: "Acme's private description",
        isInstalled: true,
        status: "enabled",
        extensions: { secret: "value" } as any
    }
});

const createContainer = (params: {
    anonymous?: boolean;
    fullAccess?: boolean;
    permissions?: { name: string }[];
}) => {
    const container = new Container();
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ isAnonymous: () => Boolean(params.anonymous) }),
        withoutAuthorization: (cb: () => Promise<unknown>) => cb(),
        hasFullAccess: async () => Boolean(params.fullAccess),
        listPermissions: async () => params.permissions ?? []
    } as any);
    container.registerInstance(Tenancy.TenantContext, {
        getTenant: () => ({ id: "acme" })
    } as any);
    container.registerInstance(GetTenantByIdUseCase, {
        execute: async () => Result.ok(tenant)
    } as any);
    container.register(GetCurrentTenantUseCaseImpl);
    return container;
};

describe("Tenant manager: getCurrentTenant", () => {
    it("refuses an anonymous identity", async () => {
        const result = await createContainer({ anonymous: true })
            .resolve(GetCurrentTenantUseCase)
            .execute();

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("NOT_AUTHORIZED");
    });

    it("returns the full tenant to an identity with full access", async () => {
        const result = await createContainer({ fullAccess: true, permissions: [{ name: "*" }] })
            .resolve(GetCurrentTenantUseCase)
            .execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toBe(tenant);
    });

    it("returns the full tenant to an identity with a permission in the tenant", async () => {
        const result = await createContainer({ permissions: [{ name: "cms.contentEntry" }] })
            .resolve(GetCurrentTenantUseCase)
            .execute();

        expect(result.isOk()).toBe(true);
        expect(result.value?.values.description).toBe("Acme's private description");
        expect(result.value?.values.extensions).toEqual({ secret: "value" });
    });

    it("returns only the ID and name to an identity without permissions in the tenant", async () => {
        for (const permissions of [[], [{ name: "aacl" }]]) {
            const result = await createContainer({ permissions })
                .resolve(GetCurrentTenantUseCase)
                .execute();

            expect(result.isOk()).toBe(true);
            expect(result.value?.id).toBe("acme");
            expect(result.value?.values).toEqual({
                name: "Acme",
                description: "",
                isInstalled: true,
                status: "enabled",
                extensions: {}
            });
        }
    });
});
