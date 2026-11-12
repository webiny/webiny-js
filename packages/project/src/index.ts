import { ProjectSdk } from "./ProjectSdk.js";

export const getProjectSdk = (...params: Parameters<(typeof ProjectSdk)["init"]>) => {
    return ProjectSdk.init(...params);
};

export { ProjectSdk };

export type { AppName } from "./abstractions/types.js";
export type * from "./abstractions/models/index.js";

export { PackageJson } from "@webiny/build-tools/utils/PackageJson.js";

export { createPathResolver } from "./utils/createPathResolver.js";
export {
    API_RUNTIME_ENV_PREFIXES,
    pickApiRuntimeEnvVariables,
    pickServerRuntimeEnvVariables
} from "./utils/apiRuntimeEnv.js";

export { ExtensionSrcResolver } from "./utils/ExtensionSrcResolver.js";

export { GracefulError } from "./GracefulError.js";

export { toImportSpecifier } from "./utils/toImportSpecifier.js";

export { FeatureFlag } from "./components/FeatureFlag.js";
export {
    WcpProjectLicenseProvider,
    useWcpProjectLicense
} from "./services/GetProjectConfigService/WcpProjectLicenseContext.js";
export {
    FeatureFlagsProvider,
    FeatureFlagsGate,
    useProjectFeatureFlags,
    setProjectFeatureFlags
} from "./services/GetProjectConfigService/FeatureFlagsContext.js";
