import { apiGenerator } from "./api";
import { adminGenerator } from "./admin";
import { PluginGenerator } from "~/types";

export const generators: Record<string, PluginGenerator> = {
    api: apiGenerator,
    admin: adminGenerator
};
