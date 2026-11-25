import { createImplementation } from "@webiny/feature/api";
import type { AdminUsersStorageOperations as IAdminUsersStorageOperations } from "~/types/users.js";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "~/types/security.js";
import { KeyValueStorageOperations } from "~/features/keyValueStore/abstractions.js";
import { SecurityStorageOperations } from "~/features/security/shared/abstractions.js";
import { AdminUsersStorageOperations } from "~/features/users/shared/storageAbstractions.js";
import { ScopeTenant } from "~/features/tenancy/ScopeTenant/abstractions.js";
import { ApiCoreStorage, ApiCoreStorageOperationsFactory } from "./abstractions.js";

class ApiCoreStorageImpl implements ApiCoreStorage.Interface {
    public readonly usersStorageOperations: IAdminUsersStorageOperations;
    public readonly tenancyStorageOperations: TenancyStorageOperations;
    public readonly securityStorageOperations: ISecurityStorageOperations;
    public readonly keyValueStorageOperations: KeyValueStorageOperations.Interface;

    public constructor(
        factory: ApiCoreStorageOperationsFactory.Interface,
        scopeTenant: ScopeTenant.Interface
    ) {
        const storageOperations = factory.create({ scopeTenant });
        this.usersStorageOperations = storageOperations.usersStorageOperations;
        this.tenancyStorageOperations = storageOperations.tenancyStorageOperations;
        this.securityStorageOperations = storageOperations.securityStorageOperations;
        this.keyValueStorageOperations = storageOperations.keyValueStorageOperations;
    }
}

/** The tenant scope's core storage: the adapter's storage, acting on the scope's tenant. */
export const ScopedApiCoreStorage = createImplementation({
    abstraction: ApiCoreStorage,
    implementation: ApiCoreStorageImpl,
    dependencies: [ApiCoreStorageOperationsFactory, ScopeTenant]
});

/**
 * A class whose instances are one part of the scope's core storage. The container constructs it
 * with the injected `ApiCoreStorage`, and the constructor hands back that part, so every part
 * comes from the one storage instance of the scope.
 */
function createStoragePart<T extends object>(part: (storage: ApiCoreStorage.Interface) => T) {
    class ApiCoreStoragePart {
        public constructor(storage: ApiCoreStorage.Interface) {
            return part(storage);
        }
    }
    return ApiCoreStoragePart as unknown as new (storage: ApiCoreStorage.Interface) => T;
}

export const ScopedSecurityStorageOperations = createImplementation({
    abstraction: SecurityStorageOperations,
    implementation: createStoragePart(storage => storage.securityStorageOperations),
    dependencies: [ApiCoreStorage]
});

export const ScopedAdminUsersStorageOperations = createImplementation({
    abstraction: AdminUsersStorageOperations,
    implementation: createStoragePart(storage => storage.usersStorageOperations),
    dependencies: [ApiCoreStorage]
});

export const ScopedKeyValueStorageOperations = createImplementation({
    abstraction: KeyValueStorageOperations,
    implementation: createStoragePart(storage => storage.keyValueStorageOperations),
    dependencies: [ApiCoreStorage]
});
