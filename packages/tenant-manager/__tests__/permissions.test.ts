import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/di";
import { Extension } from "~/api/Extension.js";
import { CreateTenantUseCase } from "~/api/features/CreateTenant/abstractions.js";
import { EnableTenantUseCase } from "~/api/features/EnableTenant/abstractions.js";
import { DisableTenantUseCase } from "~/api/features/DisableTenant/abstractions.js";
import { CreateAndInstallTenantUseCase } from "~/api/features/CreateAndInstallTenant/abstractions.js";

const INSTALL_TENANT = /* GraphQL */ `
    mutation InstallTenant($tenantId: ID!) {
        tenantManager {
            installTenant(tenantId: $tenantId) {
                data
                error {
                    code
                }
            }
        }
    }
`;

// Full CMS access, but no tenant manager permission.
const useHandler = () => {
    return createCmsTestHandler({
        permissions: [{ name: "cms.*" }],
        setup: container => Extension.register(container)
    });
};

const getContainer = async (handler: ReturnType<typeof useHandler>) => {
    const { container } = await handler.getContext<{ container: Container }>();
    return container;
};

describe("Tenant manager permissions", () => {
    it("should not create a tenant without the tm.tenant permission", async () => {
        const container = await getContainer(useHandler());

        const result = await container.resolve(CreateTenantUseCase).execute({
            name: "Tenant A",
            extensions: {}
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("NOT_AUTHORIZED");
    });

    it("should not enable, disable or install a tenant without the tm.tenant permission", async () => {
        const container = await getContainer(useHandler());

        const enableResult = await container.resolve(EnableTenantUseCase).execute("tenant-a");
        const disableResult = await container.resolve(DisableTenantUseCase).execute("tenant-a");
        const installResult = await container
            .resolve(CreateAndInstallTenantUseCase)
            .execute("tenant-a");

        for (const result of [enableResult, disableResult, installResult]) {
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("NOT_AUTHORIZED");
        }
    });

    it("should not install a tenant through the GraphQL API without the tm.tenant permission", async () => {
        const handler = useHandler();

        const [response] = await handler.invoke({
            body: { query: INSTALL_TENANT, variables: { tenantId: "tenant-a" } }
        });

        expect(response.data.tenantManager.installTenant).toMatchObject({
            data: null,
            error: { code: "SECURITY_NOT_AUTHORIZED" }
        });
    });
});
