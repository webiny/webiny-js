import { MultiTenancyConfig } from "~/enterprise/multiTenancy";
import { createMultiTenancyPlugins } from "./multiTenancy";

type EnterpriseConfig = MultiTenancyConfig;

export const createEnterprisePlugins = (config: EnterpriseConfig = {}) => {
    return createMultiTenancyPlugins(config);
};
