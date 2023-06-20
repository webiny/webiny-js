import { ContextPlugin } from "@webiny/api";
import { WcpContext } from "~/types";
import { createWcp } from "~/createWcp";

export const createWcpContext = () => {
    const plugin = new ContextPlugin<WcpContext>(async context => {
        context.wcp = await createWcp();
    });
    plugin.name = "wcp.context.create";

    return plugin;
};
