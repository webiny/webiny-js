import { Configuration as WebpackConfig } from "webpack";

export { WebpackConfig };

// Build commands.
export type BuildCommand<TOptions = Record<string, any>> = (options: TOptions) => Promise<void>;

export interface BabelConfig {
    [key: string]: any;
}

export interface DefinePluginOptions {
    [key: string]: any;
}

export interface BuildAppConfigOverrides {
    entry?: string;
    openBrowser?: boolean;
    webpack?: (config: WebpackConfig) => WebpackConfig;
    babel?: (config: BabelConfig) => BabelConfig;
}
// Build commands - apps.
export interface BuildAppConfig {
    cwd: string;
    openBrowser?: boolean;
    overrides?: BuildAppConfigOverrides;
}

export function createBuildApp(options: BuildAppConfig): BuildCommand;
export function createWatchApp(options: BuildAppConfig): BuildCommand;

// Build commands - functions.
interface BuildFunctionConfig {
    [key: string]: any;
    cwd: string;
    logs?: boolean;
    debug?: boolean;
    /**
     * Enables or disables source map generation for the function.
     * By default is set to `true`
     */
    sourceMaps?: boolean;
    overrides?: {
        entry?: string;
        output?: {
            path?: string;
            filename?: string;
        };
        define?: DefinePluginOptions;
        webpack?: (config: WebpackConfig) => WebpackConfig;
        babel?: (config: BabelConfig) => BabelConfig;
    };
}

export function createBuildFunction(options: BuildFunctionConfig): BuildCommand;
export function createWatchFunction(options: BuildFunctionConfig): BuildCommand;

export function createBuildHandler(options: BuildFunctionConfig): BuildCommand;
export function createWatchHandler(options: BuildFunctionConfig): BuildCommand;

// Build commands - packages.
interface BuildPackageConfig {
    [key: string]: any;
    cwd: string;
    logs?: boolean;
    debug?: boolean;

    overrides?: {
        tsConfig?: Record<string, any> | ((tsConfig: Record<string, any>) => Record<string, any>);
    };
}

interface BabelConfigParams {
    path: string;
    esm?: boolean;
}

export function createBuildPackage(options: BuildPackageConfig): BuildCommand;
export function createWatchPackage(options: BuildPackageConfig): BuildCommand;
export function createBabelConfigForNode(options: BabelConfigParams): BabelConfig;
export function createBabelConfigForReact(options: BabelConfigParams): BabelConfig;
