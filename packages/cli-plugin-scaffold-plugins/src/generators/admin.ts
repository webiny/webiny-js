import { addReactPluginToReactApp } from "./utils/addReactPluginToReactApp";
import { PluginGenerator } from "~/types";

export const adminGenerator: PluginGenerator = async ({ input }) => {
    await addReactPluginToReactApp(input);
};
