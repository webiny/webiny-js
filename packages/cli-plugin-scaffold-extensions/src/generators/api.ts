import { addPluginToApiApp } from "./utils/addPluginToApiApp";
import { PluginGenerator } from "~/types";

export const apiGenerator: PluginGenerator = async ({ input }) => {
    await addPluginToApiApp(input);
};
