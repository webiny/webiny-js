import { Context as BaseContext } from "@webiny/api/types.js";
import type { SecurityStorageOperations } from "~/types/security.js";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import type { AdminUsersStorageOperations } from "~/types/users.js";
import { KeyValueStorageOperations } from "~/features/keyValueStore/index.js";
import type { ILicense } from "@webiny/wcp/types.js";

/**
 * The base handler context available to all api-core GraphQL resolvers and event handlers.
 * Services are accessed via `context.container.resolve(...)`, not via context properties.
 */
export type ApiCoreContext = BaseContext;

export type ApiCoreStorageOperations = {
    usersStorageOperations: AdminUsersStorageOperations;
    tenancyStorageOperations: TenancyStorageOperations;
    securityStorageOperations: SecurityStorageOperations;
    keyValueStorageOperations: KeyValueStorageOperations.Interface;
};

/**
 * Config for `ApiCoreFeature.register` — runtime options only. Storage operations are no longer
 * passed here; they are resolved from `ApiCoreStorageOperationsFactory` inside the feature
 * (registered by a storage adapter or `registerApiCoreStorageOperations`).
 *
 * `wcpLicense` is effectively a TEST SEAM. In production nothing passes it: `registerApiRequestStack`
 * awaits `WcpLicenseLoader.load()` before registering, and `WcpLicenseProvider.get()` reads that
 * process cache. Tests pass a pre-resolved license instead, which seeds the same cache.
 */
export type ApiCoreConfig = {
    wcpLicense?: ILicense;
};
