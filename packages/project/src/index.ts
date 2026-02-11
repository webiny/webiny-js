import { ProjectSdk } from "./ProjectSdk.js";
import { type GetAppStackOutput } from "~/abstractions/index.js";
import { type AppName } from "~/abstractions/types.js";

export const getProjectSdk = (...params: Parameters<(typeof ProjectSdk)["init"]>) => {
    return ProjectSdk.init(...params);
};

// A temporary convenience function to get the stack output for a specific app. We might revisit this in the
// future and double check if there's a better way to expose this functionality.
export const getStackOutput = async <
    TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput
>(
    appName: AppName
) => {
    const sdk = await getProjectSdk();
    return sdk.getAppStackOutput<TOutput>(appName);
};

export { ProjectSdk };

export type { AppName } from "./abstractions/types.js";
export type * from "./abstractions/models/index.js";

export type { IStackOutput } from "~/abstractions/features/GetAppStackOutput.js";

export { PackageJson } from "@webiny/build-tools/utils/PackageJson.js";

export { createPathResolver } from "./utils/createPathResolver.js";

export { GracefulError } from "./GracefulError.js";

export { Wcp } from "./components/Wcp.js";
export {
    WcpProjectLicenseProvider,
    useWcpProjectLicense
} from "./services/GetProjectConfigService/WcpProjectLicenseContext.js";
