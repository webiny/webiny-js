import { addPluginToReactApp } from "./utils/addPluginToReactApp";
import { PluginGenerator } from "~/types";

export const adminGenerator: PluginGenerator = async ({ input }) => {
    await addPluginToReactApp(input);
};
