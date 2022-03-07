import { Args, Configuration } from "~/types";

export default (args?: Args, configuration?: Configuration) => {
    const folder = args?.configuration?.storage?.folder ?? configuration?.storage?.folder;
    return typeof folder === "string" ? folder : "";
};
