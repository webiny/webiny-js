import path from "path";
import { Args, Configuration } from "~/types";

export default (args: Args, configuration: Configuration) => {
    if (args.url) {
        return args.url;
    }

    const websiteUrl = args?.configuration?.website?.url || configuration?.website?.url;
    return path.join(websiteUrl as string, args.path as string);
};
