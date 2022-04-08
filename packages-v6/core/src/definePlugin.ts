import path from "path";
import type { Configuration } from "webpack";
import { Plugin as ApiPlugin } from "@webiny/plugins";
import { PulumiApp } from "@webiny/pulumi-sdk-v6";
import { AsyncProcessor } from "./compose";
import { BabelConfig } from "./types";

export interface PluginAdminConfig {
    plugin?: string;
    config?: string;
    define?: Record<string, string>;
    webpack?: (config: Configuration) => Configuration;
    babel?: (config: BabelConfig) => BabelConfig;
}

export enum FunctionHandlerTemplate {
    /**
     * This template is used for GraphQL APIs
     */
    "GRAPHQL" = "graphql",
    /**
     * This template is used for any pluginable handler.
     */
    "GENERIC" = "generic",
    /**
     * This template is used for custom function handlers.
     */
    "CUSTOM" = "custom"
}

export interface PluginHandlerConfig {
    /**
     * Source code template for this function handler.
     */
    template?: FunctionHandlerTemplate;
    /**
     * Path to a file defining function handler plugins.
     */
    handler?: string;
    /**
     * Path to a file defining function handler config plugin.
     */
    config?: string;
    /**
     * These values will be passed to the webpack.DefinePlugin to be baked into the handler bundle.
     */
    define?: Record<string, string>;

    /**
     * Webpack config modifier function.
     */
    webpack?(config: Configuration): Configuration;
}

export interface PulumiApps {
    api: PulumiApp;
    admin?: unknown;
    website?: unknown;
}

export interface PulumiConfigCallable {
    (pulumiApps: PulumiApps): Promise<void>;
}

export interface PluginApiConfig {
    /**
     * Main GraphQL API Lambda function
     */
    graphql?: PluginHandlerConfig;
}

export interface Plugin {
    __options?: unknown;
    name: string;
    admin?: PluginAdminConfig;
    api?: PluginApiConfig;
    pulumi?: string;
}

export type FunctionName = Extract<keyof PluginApiConfig, string>;

export interface PluginFactoryWithOptions<TOptions> {
    (options: TOptions): Plugin;
}

interface PluginFactoryWithoutOptions {
    (): Plugin;
}

/**
 * We need to support 2 use cases:
 * 1) a plugin factory without options
 * 2) a plugin factory with required options
 *
 * Using function overload, we can satisfy both use cases within one `definePlugin` function.
 *
 * NOTE: you will be able to add extra keys to the return value of plugin factory.
 * This is an eternal bug in TS: https://github.com/microsoft/TypeScript/pull/40311.
 * If you want to force strict check on the return value, you'll have to use the Plugin type:
 * ```
 * definePlugin((): Plugin => {});
 * ```
 */

export function definePlugin(factory: PluginFactoryWithoutOptions): PluginFactoryWithoutOptions;

export function definePlugin<TOptions>(
    factory: PluginFactoryWithOptions<TOptions>
): PluginFactoryWithOptions<TOptions>;

export function definePlugin(factory: any) {
    return (options: any) => ({
        ...factory(options),
        __options: options
    });
}

export interface FunctionHandlerConfig {
    debug: boolean;
}

// We need an empty interface to augment it with plugins.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdminConfig {}

export type ConfigModifier<TConfig> = AsyncProcessor<TConfig>;
export type PluginsModifier<TPlugin> = AsyncProcessor<TPlugin[]>;

export const defineHandlerConfig = (
    fn: AsyncProcessor<FunctionHandlerConfig>
): AsyncProcessor<FunctionHandlerConfig> => {
    return next => input => fn(next)(input);
};

export interface ProcessorFactory<TConfig, TInput> {
    (config: TConfig): AsyncProcessor<TInput>;
}

type HandlerConfigurator = ProcessorFactory<FunctionHandlerConfig, ApiPlugin[]>;

export function defineHandlerPlugin(fn: HandlerConfigurator): HandlerConfigurator {
    return config => next => input => {
        // We intercept the return value, to flatten the output.
        return fn(config)(next)(input).then(value => value.flat(Infinity));
    };
}

export function defineAdminConfig(fn: AsyncProcessor<AdminConfig>): AsyncProcessor<AdminConfig> {
    return next => input => fn(next)(input);
}

type AdminConfigurator = ProcessorFactory<AdminConfig, JSX.Element[]>;

export function defineAdminPlugin(fn: AdminConfigurator): AdminConfigurator {
    return config => next => input => fn(config)(next)(input);
}

interface PulumiConfigurator<TOptions> {
    (options: TOptions): (pulumiApps: PulumiApps) => void | Promise<void>;
}

export function definePulumiConfig<TOptions = unknown>(fn: PulumiConfigurator<TOptions>) {
    return (options: TOptions) => (pulumiApps: PulumiApps) => fn(options)(pulumiApps);
}

/**
 * Create file path resolver.
 * We need this, because `require.resolve` has a special meaning during Webpack bundling process, and it adds
 * the resolved modules to the bundle as soon as it runs into `require.resolve`.
 *
 * Since our main project plugin can export React components, we can expect webpack to run into this problem
 * sooner or later, and process files which are not meant for React apps. It can be thousands of unused files.
 *
 * Instead of `require.resolve`, we use `path.join`. This will help us control the internals
 * of the resolution process in the future.
 */
export function createResolver(dir: string) {
    return function resolver(filePath: string) {
        if (dir.includes("cjs")) {
            dir = dir.replace("cjs", "esm");
        }
        return path.join(dir || "", filePath);
    };
}
