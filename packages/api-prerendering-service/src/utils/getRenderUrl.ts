import trimEnd from "lodash/trimEnd";
import { Args, Configuration } from "~/types";

export const getRenderUrl = (args: Args, configuration: Configuration) => {
    if (args.url) {
        return args.url;
    }

    const websiteUrl = args?.configuration?.website?.url || configuration?.website?.url;

    return [trimEnd(websiteUrl, "/"), args.path].join("");
};
