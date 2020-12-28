import { Args, Configuration } from "../types";

export default (args: Args, configuration: Configuration) => {
    return args?.configuration?.storage.folder ?? configuration?.storage.folder;
};
