import { Configuration as WebpackConfig, DefinePlugin, Loader } from "webpack";

export function traverseLoaders(loaders: Loader[], onLoader: (loader: Loader) => void): void;

// Build commands.
export type BuildCommand<TOptions = Record<string, any>> = (options: TOptions) => Promise<void>;

interface BabelConfig {
    [key: string]: any;
}

interface DefinePluginOptions {
    [key: string]: DefinePlugin.CodeValueObject;
}

// Build commands - apps.
interface BuildAppConfig {
    cwd: string;
    openBrowser?: boolean;
    overrides?: {
        entry?: string;
        openBrowser?: boolean;
        webpack?: (config: WebpackConfig) => WebpackConfig;
        babel?: (config: BabelConfig) => BabelConfig;
    };
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
