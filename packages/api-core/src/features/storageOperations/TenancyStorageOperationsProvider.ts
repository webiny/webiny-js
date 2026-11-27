import { createImplementation } from "@webiny/feature/api";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import {
    ApiCoreStorageOperationsFactory,
    TenancyStorageOperationsFactory,
    TenancyStorageOperationsProvider
} from "./abstractions.js";
import { MissingTenancyStorageOperationsError } from "./errors.js";
import { tenantNeutralScopeTenant } from "~/features/tenancy/ScopeTenant/scopeTenants.js";

class TenancyStorageOperationsProviderImpl implements TenancyStorageOperationsProvider.Interface {
    constructor(
        private readonly tenancyFactory: TenancyStorageOperationsFactory.Interface | undefined,
        private readonly coreFactory: ApiCoreStorageOperationsFactory.Interface | undefined
    ) {}

    create(): TenancyStorageOperations {
        if (this.tenancyFactory) {
            return this.tenancyFactory.create();
        }
        if (this.coreFactory) {
            // The tenant registry is tenant-neutral: it reads and writes the tenant records of
            // any tenant, so it gets no scope tenant.
            return this.coreFactory.create({ scopeTenant: tenantNeutralScopeTenant })
                .tenancyStorageOperations;
        }
        throw new MissingTenancyStorageOperationsError();
    }
}

export const DefaultTenancyStorageOperationsProvider = createImplementation({
    abstraction: TenancyStorageOperationsProvider,
    implementation: TenancyStorageOperationsProviderImpl,
    dependencies: [
        [TenancyStorageOperationsFactory, { optional: true }],
        [ApiCoreStorageOperationsFactory, { optional: true }]
    ]
});
