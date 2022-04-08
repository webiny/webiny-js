import { WebinyOptions } from "./types";

export * from "./compose";
export type {
    Webiny,
    WebinyOptions,
    ProjectConfigFactory,
    ProjectDeployConfig,
    ProjectConfig
} from "./types";
export type { AsyncProcessor, NextAsyncProcessor } from "./compose";
export * from "./definePlugin";
export type {
    AdminConfig,
    PluginApiConfig,
    FunctionHandlerConfig,
    PluginHandlerConfig,
    Plugin,
    PulumiApps,
    PluginFactoryWithOptions,
    PluginAdminConfig,
    PulumiConfigCallable,
    ProcessorFactory
} from "./definePlugin";
export * from "./definePreset";
export * from "./defineProject";
export type { Preset, PresetFactory } from "./definePreset";

export const initializeWebiny = (params: WebinyOptions) => {
    return import(/* webpackIgnore: true */ "./webiny").then(m => m.initializeWebiny(params));
};
