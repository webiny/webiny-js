import { createHeadlessCms } from "~/applications/createHeadlessCms";
import { CliSeedContext } from "~/types";

export const getDefaultPlugins = (context: CliSeedContext) => {
    return [createHeadlessCms(context)];
};
