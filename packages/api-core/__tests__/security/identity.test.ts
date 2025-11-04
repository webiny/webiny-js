import { describe, it, expect, beforeAll } from "vitest";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { Container } from "@webiny/di";
import { CreateTenantLinks } from "~/features/security/tenantLinks/CreateTenantLinks/index.js";
import { UpdateTenantLinks } from "~/features/security/tenantLinks/UpdateTenantLinks/index.js";
import { DeleteTenantLinks } from "~/features/security/tenantLinks/DeleteTenantLinks/index.js";
import { ListTenantLinksByType } from "~/features/security/tenantLinks/ListTenantLinksByType/index.js";
import { ListTenantLinksByTenant } from "~/features/security/tenantLinks/ListTenantLinksByTenant/index.js";
import { ListTenantLinksByIdentity } from "~/features/security/tenantLinks/ListTenantLinksByIdentity/index.js";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import type { SecurityStorageOperations } from "~/types/security.js";
import type { AdminUsersStorageOperations } from "~/types/users.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";

describe("identity test", () => {
    const tenant = "root";
    let container: Container;

    beforeAll(async () => {
        // Create a new container for each test
        container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
    });

    it("should create, update, delete, and list tenant links", async () => {
        const link1 = {
            tenant,
            identity: "1",
            type: "group",
            data: { groups: ["full-access"] }
        };

        const link2 = { tenant, identity: "2", type: "role", data: { role: "OWNER" } };

        // Create tenant links
        const createUseCase = container.resolve(CreateTenantLinks);
        const createResult = await createUseCase.execute([link1, link2]);
        if (createResult.isFail()) {
            throw createResult.error;
        }

        // List by identity
        const listByIdentityUseCase = container.resolve(ListTenantLinksByIdentity);
        const linksByIdentityResult = await listByIdentityUseCase.execute({
            identity: "1"
        });
        if (linksByIdentityResult.isFail()) {
            throw linksByIdentityResult.error;
        }
        const linksByIdentity = linksByIdentityResult.value;

        expect(linksByIdentity[0]).toEqual({
            ...link1,
            createdOn: expect.any(String),
            webinyVersion: process.env.WEBINY_VERSION
        });

        // List by type
        const listByTypeUseCase = container.resolve(ListTenantLinksByType);
        const linksByTypeResult = await listByTypeUseCase.execute({
            type: "group",
            tenant
        });
        if (linksByTypeResult.isFail()) {
            throw linksByTypeResult.error;
        }
        const linksByType = linksByTypeResult.value;

        expect(linksByType[0]).toEqual({
            ...link1,
            createdOn: expect.any(String),
            webinyVersion: process.env.WEBINY_VERSION
        });

        // List by tenant
        const listByTenantUseCase = container.resolve(ListTenantLinksByTenant);
        const linksByTenantResult = await listByTenantUseCase.execute({
            tenant
        });
        if (linksByTenantResult.isFail()) {
            throw linksByTenantResult.error;
        }
        const linksByTenant = linksByTenantResult.value;

        expect(linksByTenant).toEqual([
            { ...link1, createdOn: expect.any(String), webinyVersion: process.env.WEBINY_VERSION },
            { ...link2, createdOn: expect.any(String), webinyVersion: process.env.WEBINY_VERSION }
        ]);

        // Update tenant links
        const updateUseCase = container.resolve(UpdateTenantLinks);
        const updateResult = await updateUseCase.execute([{ ...link2, type: "idp" }]);
        if (updateResult.isFail()) {
            throw updateResult.error;
        }

        // List by type again (idp)
        const idpLinksResult = await listByTypeUseCase.execute({
            tenant,
            type: "idp"
        });
        if (idpLinksResult.isFail()) {
            throw idpLinksResult.error;
        }
        const idpLinks = idpLinksResult.value;

        expect(idpLinks.length).toBe(1);

        // Delete tenant links
        const deleteUseCase = container.resolve(DeleteTenantLinks);
        const deleteResult = await deleteUseCase.execute([
            { identity: "1", tenant },
            { identity: "2", tenant }
        ]);
        if (deleteResult.isFail()) {
            throw deleteResult.error;
        }

        // List by tenant again (should be empty)
        const remainingResult = await listByTenantUseCase.execute({
            tenant
        });
        if (remainingResult.isFail()) {
            throw remainingResult.error;
        }
        const remainingLinksByTenant = remainingResult.value;

        expect(remainingLinksByTenant.length).toBe(0);
    });
});
