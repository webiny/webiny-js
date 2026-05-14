import { Configuration as RspackConfig } from "@rspack/core";

export { RspackConfig };

// Build commands.
export type BuildCommand<TOptions = Record<string, any>> = (options: TOptions) => Promise<void>;

export interface SwcConfig {
    [key: string]: any;
}

export interface DefinePluginOptions {
    [key: string]: any;
}

export interface BuildAppConfigOverrides {
    entry?: string;
    openBrowser?: boolean;
}
// Build commands - apps.
export interface BuildAppConfig {
    cwd: string;
    openBrowser?: boolean;
    overrides?: BuildAppConfigOverrides;
}

export function createBuildAdmin(options: BuildAppConfig): BuildCommand;
export function createWatchAdmin(options: BuildAppConfig): BuildCommand;

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
        rspack?: (config: RspackConfig) => RspackConfig;
        swc?: (config: SwcConfig) => SwcConfig;
    };
}

export function createBuildFunction(options: BuildFunctionConfig): BuildCommand;
export function createWatchFunction(options: BuildFunctionConfig): BuildCommand;

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

export function createBuildPackage(options: BuildPackageConfig): BuildCommand;
export function createWatchPackage(options: BuildPackageConfig): BuildCommand;
