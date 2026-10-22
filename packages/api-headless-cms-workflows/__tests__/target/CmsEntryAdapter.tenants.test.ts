import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { CreateTenantUseCase } from "@webiny/api-core/features/tenancy/CreateTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeGetFlp } from "~tests/__helpers/FakeGetFlp.js";

const IN_ROOT = "user-stored-in-root";
const IN_CHILD = "user-stored-in-child";

const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
};

const createChildTenant = async (context: CmsContext, tenantId: string) => {
    return expectOk(
        await context.container.resolve(IdentityContext).withoutAuthorization(() => {
            return context.container.resolve(CreateTenantUseCase).execute({
                id: tenantId,
                name: tenantId,
                description: "Child tenant",
                tags: [],
                parent: "root"
            });
        })
    );
};

/** Stores a real admin user in the current tenant, or in `tenant` (setup, so without authorization). */
const storeUser = async (context: CmsContext, id: string, tenant?: Tenant) => {
    const tenantContext = context.container.resolve(TenantContext);
    await tenantContext.withTenant(tenant ?? tenantContext.getTenant(), async () => {
        await context.container.resolve(IdentityContext).withoutAuthorization(async () => {
            expectOk(
                await context.container.resolve(CreateUserUseCase).execute({
                    id,
                    email: `${id}@webiny.test`,
                    firstName: id,
                    lastName: "Test"
                })
            );
        });
    });
};

describe("CMS target adapter, tenant membership of stored admin users (R68)", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("checks only the admin users routing lists in the current tenant (R68)", async () => {
        const { context: getContext } = createContextHandler({
            legacyPlugins: [registerFakes],
            permissionsByIdentity: { [IN_ROOT]: CMS_READER, [IN_CHILD]: CMS_READER }
        });
        const context = await getContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await storeUser(context, IN_ROOT);
        await storeUser(context, IN_CHILD, await createChildTenant(context, "child-tenant"));
        const access = context.container
            .resolveAll(ReviewTargetReadAccess)
            .find(item => item.canHandle(AUTHOR_NAMESPACE))!;

        // Routing lists the candidates as the system, in the current tenant only.
        const listed = expectOk(
            await context.container.resolve(IdentityContext).withoutAuthorization(() => {
                return context.container
                    .resolve(ListUsersUseCase)
                    .execute({ where: { id_in: [IN_ROOT, IN_CHILD] } });
            })
        );
        const readable = await access.filterReadableUsers({
            model: AUTHOR_NAMESPACE,
            read: { type: "target", targetId: entry.entryId, targetRevisionId: entry.id },
            users: listed
        });

        expect(listed.map(user => user.id)).toEqual([IN_ROOT]);
        expect(readable).toEqual([IN_ROOT]);
    });
});
