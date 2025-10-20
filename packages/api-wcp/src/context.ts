import { ContextPlugin } from "@webiny/api";
import type { WcpContext } from "~/types.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { GetProject } from "~/features/GetProject/feature.js";
import { LegacyWcpContext } from "~/legacy/LegacyWcpContext.js";
import { WcpContextFeature } from "~/features/WcpContext/feature.js";

export interface CreateWcpContextParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createWcpContext = (params: CreateWcpContextParams = {}) => {
    const plugin = new ContextPlugin<WcpContext>(async context => {
        // Register features
        WcpContextFeature.register(context.container, params);
        GetProject.register(context.container, context);

        // Legacy context
        context.wcp = new LegacyWcpContext(context.container);
    });

    plugin.name = "wcp.context.create";

    return plugin;
};
