import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createFileManagerAco } from "./index.js";

export const FileManagerAcoFeature = createFeature({
    name: "FileManagerAco",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextEnhancer(container, [createFileManagerAco()]);
    }
});
