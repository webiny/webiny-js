import { PluginsContainer } from "@webiny/plugins";
import { createCmsExtension } from "~/index";

export const usePlugins = () => {
    return new PluginsContainer([createCmsExtension()].flat(Infinity as 1) as any[]);
};
