import { createImplementation } from "@webiny/feature/api";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import {
    ApiCoreStorageOperationsFactory,
    TenancyStorageOperationsFactory,
    TenancyStorageOperationsProvider
} from "./abstractions.js";
import { MissingTenancyStorageOperationsError } from "./errors.js";

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
            return this.coreFactory.create().tenancyStorageOperations;
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
