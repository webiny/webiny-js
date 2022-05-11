import { Args, Configuration } from "~/types";

export default (args?: Args, configuration?: Configuration) => {
    let folder = args?.configuration?.storage?.folder ?? configuration?.storage?.folder;
    if (typeof folder === "string") {
        return folder;
    }

    // Fall back to calculating folder from path if available.
    folder = args?.path || "";
    if (folder.startsWith("/")) {
        folder = folder.substring(1);
    }

    return folder;
};
