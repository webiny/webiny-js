import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import type { Abstraction } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";
import { UpdateTenantUseCase as ApiCoreUpdateTenant } from "@webiny/api-core/features/tenancy/UpdateTenant";
import { CreateTenantUseCase } from "~/api/features/CreateTenant/abstractions.js";
import { CreateTenantRepository } from "~/api/features/CreateTenant/abstractions.js";
import CreateTenantUseCaseImpl from "~/api/features/CreateTenant/CreateTenantUseCase.js";
import { EnableTenantUseCase } from "~/api/features/EnableTenant/abstractions.js";
import EnableTenantUseCaseImpl from "~/api/features/EnableTenant/EnableTenantUseCase.js";
import { DisableTenantUseCase } from "~/api/features/DisableTenant/abstractions.js";
import DisableTenantUseCaseImpl from "~/api/features/DisableTenant/DisableTenantUseCase.js";
import { CreateAndInstallTenantUseCase } from "~/api/features/CreateAndInstallTenant/abstractions.js";
import CreateAndInstallTenantUseCaseImpl from "~/api/features/CreateAndInstallTenant/CreateAndInstallTenantUseCase.js";
import { GetTenantByIdUseCase } from "~/api/features/GetTenantById/abstractions.js";
import { UpdateTenantUseCase } from "~/api/features/UpdateTenant/abstractions.js";
import InstallTenantSchema from "~/api/graphql/InstallTenantSchema.js";

// An identity that is logged in, but has no tenant manager permission.
const identityWithoutPermission = {
    getPermission: async () => null
};

// Everything besides IdentityContext only runs after the permission check, so empty stubs are enough.
const STUBBED_DEPENDENCIES: Abstraction<any>[] = [
    CreateTenantRepository,
    EventPublisher,
    ApiCoreUpdateTenant,
    UpdateTenantUseCase,
    GetTenantByIdUseCase,
    Tenancy.GetTenantByIdUseCase,
    Tenancy.CreateTenantUseCase,
    Tenancy.UpdateTenantUseCase,
    Tenancy.DeleteTenantUseCase,
    Tenancy.InstallTenantUseCase
];

const createContainer = () => {
    const container = new Container();
    container.registerInstance(IdentityContext, identityWithoutPermission as any);
    for (const dependency of STUBBED_DEPENDENCIES) {
        container.registerInstance(dependency, {} as any);
    }
    container.register(CreateTenantUseCaseImpl);
    container.register(EnableTenantUseCaseImpl);
    container.register(DisableTenantUseCaseImpl);
    container.register(CreateAndInstallTenantUseCaseImpl);
    return container;
};

describe("Tenant manager permissions", () => {
    it("should not create, enable, disable or install a tenant without the tm.tenant permission", async () => {
        const container = createContainer();

        const results = [
            await container.resolve(CreateTenantUseCase).execute({
                name: "Tenant A",
                extensions: {}
            }),
            await container.resolve(EnableTenantUseCase).execute("tenant-a"),
            await container.resolve(DisableTenantUseCase).execute("tenant-a"),
            await container.resolve(CreateAndInstallTenantUseCase).execute("tenant-a")
        ];

        for (const result of results) {
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("NOT_AUTHORIZED");
        }
    });

    it("should not install a tenant through the installTenant resolver without the tm.tenant permission", async () => {
        const resolvers: Record<string, any> = {};
        const builder = {
            addTypeDefs: () => builder,
            addResolver: (config: { path: string; resolver: (...deps: any[]) => any }) => {
                resolvers[config.path] = config.resolver;
                return builder;
            }
        };
        await new (InstallTenantSchema as any)().execute(builder);

        const installTenant = { execute: async () => ({ isFail: () => false }) };
        const resolver = resolvers["TenantManagerMutation.installTenant"](
            identityWithoutPermission,
            installTenant
        );
        const response = await resolver({ args: { tenantId: "tenant-a" } });

        expect(response).toMatchObject({
            data: null,
            error: { code: "SECURITY_NOT_AUTHORIZED" }
        });
    });
});
