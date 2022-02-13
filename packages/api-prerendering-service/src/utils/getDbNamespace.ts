import { Args, Configuration } from "~/types";

export default (args: Args, configuration: Configuration): string => {
    return args?.configuration?.db?.namespace || configuration?.db?.folder?.namespace || "";
};
