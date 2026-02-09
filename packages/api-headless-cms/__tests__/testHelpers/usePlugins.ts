import type { CreateHandlerCoreParams } from "~tests/testHelpers/plugins";
import { createHandlerCore } from "~tests/testHelpers/plugins";
import { PluginsContainer } from "@webiny/plugins";

export type UsePluginsParams = CreateHandlerCoreParams;
export const usePlugins = (params?: UsePluginsParams) => {
    const core = createHandlerCore(params);

    return new PluginsContainer(core.plugins);
};
