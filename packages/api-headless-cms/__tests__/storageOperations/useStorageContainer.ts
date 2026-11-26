import { beforeEach } from "vitest";
import type { Abstraction, Container } from "@webiny/di";
import { TenantScopes } from "@webiny/api-core/exports/api/tenancy.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

/**
 * Registers the handler and returns a getter for the DI container of the current test.
 * Storage operations are created during context initialization, so a query runs first.
 */
export const useStorageContainer = (): (() => Container) => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
    });

    return () => container;
};

type Executable = { execute: (...args: any[]) => Promise<unknown> };

/** The tenant a storage call names: `model.tenant`, `params.tenant`, `where.tenant`, `group.tenant`, … */
const findTenant = (args: unknown[]): string | undefined => {
    for (const arg of args) {
        if (!arg || typeof arg !== "object") {
            continue;
        }
        const value = arg as Record<string, any>;
        const candidates = [
            value.tenant,
            value.where?.tenant,
            value.model?.tenant,
            value.group?.tenant,
            value.entry?.tenant,
            value.storageEntry?.tenant
        ];
        const tenant = candidates.find(candidate => typeof candidate === "string" && candidate);
        if (tenant) {
            return tenant;
        }
    }
    return undefined;
};

/**
 * Like {@link useStorageContainer}, for tests that work with several tenants' data: storage acts only
 * on its scope's tenant, so each call runs in the scope of the tenant its arguments name, as the API
 * does with `TenantScopes.withTenant()`. A call that names no tenant runs in the current scope.
 */
export const useTenantRoutedStorageContainer = (): (() => Container) => {
    const getContainer = useStorageContainer();

    return () => {
        const container = getContainer();
        const resolve = <T>(abstraction: Abstraction<T>): T => {
            const operation: Executable = {
                execute: async (...args: unknown[]) => {
                    const tenantId = findTenant(args);
                    if (!tenantId) {
                        return (container.resolve(abstraction) as Executable).execute(...args);
                    }
                    const tenant = {
                        id: tenantId,
                        name: tenantId,
                        status: "enabled",
                        isInstalled: true,
                        parent: "root"
                    } as Tenant;
                    return container.resolve(TenantScopes).withTenant(tenant, async scope => {
                        return (scope.resolve(abstraction) as Executable).execute(...args);
                    });
                }
            };
            return operation as T;
        };
        return { resolve } as unknown as Container;
    };
};
