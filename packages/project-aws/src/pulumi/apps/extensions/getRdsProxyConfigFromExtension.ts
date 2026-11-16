import { RdsProxy as rdsProxyExt } from "@webiny/project-extensions-aws/extensions/RdsProxy.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

/**
 * Whether `<Infra.RdsProxy enabled />` is set. Off when the extension is absent.
 */
export const getRdsProxyConfigFromExtension = (projectConfig: IProjectConfigModel): boolean => {
    const [rdsProxyExtension] = projectConfig.extensionsByType(rdsProxyExt);
    return rdsProxyExtension?.params?.enabled === true;
};
