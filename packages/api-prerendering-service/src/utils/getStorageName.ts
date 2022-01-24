import { Args, Configuration } from "~/types";

export default (args: Args, configuration: Configuration) => {
    return args?.configuration?.storage?.name || configuration?.storage.name;
};
