import { Plugin } from "@webiny/plugins/types";
import { ContextPlugin } from "@webiny/handler";
import { extendHeadlessCmsGraphQL } from "~/graphQl";
import { CmsContext } from "@webiny/api-headless-cms/types";

const createContextPlugin = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        await extendHeadlessCmsGraphQL(context);
    });
    plugin.name = "headless-cms-aco.createContext";
    return plugin;
};

export const createHeadlessCmsAco = (): Plugin[] => {
    return [createContextPlugin()];
};
