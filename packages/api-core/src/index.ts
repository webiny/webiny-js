export { ApiCoreFeature } from "./ApiCoreFeature.js";
export {
    ApiCoreStorageOperationsFactory,
    TenancyStorageOperationsFactory,
    registerApiCoreStorageOperations,
    type ApiCoreStorageOperationsBuilder
} from "./features/storageOperations/abstractions.js";
export {
    ScopeTenant,
    NoScopeTenantError,
    createFixedScopeTenant
} from "./features/tenancy/ScopeTenant/index.js";
export { RequestStorage } from "./features/requestStorage/index.js";
export { WcpLicenseProvider } from "./features/wcp/WcpLicenseProvider.js";
