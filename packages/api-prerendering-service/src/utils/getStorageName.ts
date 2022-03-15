import { Args, Configuration } from "~/types";

export default (args?: Args, configuration?: Configuration): string => {
    return args?.configuration?.storage?.name || (configuration?.storage?.name as string);
};
