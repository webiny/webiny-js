import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/api-kernel-core";
import {
    ApiCoreStorageOperationsFactory,
    registerApiCoreStorageOperations,
    RequestStorage,
    TenancyStorageOperationsFactory
} from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    TenantScopeRegistration,
    TenantScopes
} from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import {
    registerApiRequestStack,
    registerApiRequestStackInOneContainer
} from "~/registerApiRequestStack.js";

// Registration only: nothing here runs a storage operation.
const tenancyStorageOperations = {} as unknown as TenancyStorageOperations;
const storageOperations = {
    usersStorageOperations: {},
    tenancyStorageOperations,
    securityStorageOperations: {},
    keyValueStorageOperations: {}
} as unknown as ApiCoreStorageOperations;

/** A root with the tenant registry's storage, as a storage adapter registers it. */
const createRoot = () => {
    const root = new Container();
    root.registerInstance(TenancyStorageOperationsFactory, {
        create: () => tenancyStorageOperations
    });
    return root;
};

describe("registerApiRequestStack", () => {
    it("registers only the tenant-neutral part in the request container", async () => {
        const root = createRoot();
        registerApiCoreStorageOperations(root, storageOperations);

        const request = root.createChildContainer();
        request.registerInstance(RequestContainer, request);
        await registerApiRequestStack(request, { extensions: () => [] });

        // The tenant registry the request's tenant is loaded from, and the scopes.
        expect(request.resolve(GetTenantByIdUseCase)).toBeTruthy();
        expect(request.resolve(TenantScopes)).toBeTruthy();
        // Nothing tenant-specific.
        expect(() => request.resolve(TenantContext)).toThrow(
            "No registration found for TenantContext"
        );
    });

    it("registers every RequestStorage in each tenant scope before any feature", async () => {
        const root = createRoot();
        const registeredIn: Container[] = [];
        const storages = ["core", "login"].map(name => {
            const storage: RequestStorage.Interface = {
                register(container) {
                    registeredIn.push(container);
                    if (name === "core") {
                        // `ApiCoreFeature` resolves it while it registers, so it must come first.
                        registerApiCoreStorageOperations(container, storageOperations);
                    }
                }
            };
            return storage;
        });
        for (const storage of storages) {
            root.registerInstance(RequestStorage, storage);
        }

        const request = root.createChildContainer();
        await registerApiRequestStack(request, { extensions: () => [] });
        expect(registeredIn).toEqual([]);

        const scope = request.createChildContainer();
        await request.resolve(TenantScopeRegistration).register(scope);

        expect(registeredIn).toEqual([scope, scope]);
        expect(scope.resolve(ApiCoreStorageOperationsFactory).create()).toBe(storageOperations);
        expect(scope.resolve(TenantContext)).toBeTruthy();
        expect(() => request.resolve(ApiCoreStorageOperationsFactory)).toThrow();
    });

    // The DynamoDB variants: their storage is in the root, and they register no RequestStorage.
    it("builds a tenant scope on the root's storage when no RequestStorage is registered", async () => {
        const root = createRoot();
        registerApiCoreStorageOperations(root, storageOperations);

        const request = root.createChildContainer();
        await registerApiRequestStack(request, { extensions: () => [] });
        const scope = request.createChildContainer();
        await request.resolve(TenantScopeRegistration).register(scope);

        expect(scope.resolveAll(RequestStorage)).toEqual([]);
        expect(scope.resolve(ApiCoreStorageOperationsFactory).create()).toBe(storageOperations);
    });

    // The SQL schema setup: everything a request has, without a tenant.
    it("registers both parts in one container for work outside a request", async () => {
        const root = createRoot();
        registerApiCoreStorageOperations(root, storageOperations);

        const container = root.createChildContainer();
        await registerApiRequestStackInOneContainer(container, { extensions: () => [] });

        expect(container.resolve(GetTenantByIdUseCase)).toBeTruthy();
        expect(container.resolve(TenantContext)).toBeTruthy();
    });
});
