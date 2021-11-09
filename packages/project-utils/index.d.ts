import { Configuration as WebpackConfig, DefinePlugin, Loader } from "webpack";

interface BabelConfig {
    [key: string]: any;
}

interface DefinePluginOptions {
    [key: string]: DefinePlugin.CodeValueObject;
}

interface AppBuildOptions {
    entry?: string;
    openBrowser?: boolean;
    webpack?: (config: WebpackConfig) => WebpackConfig;
    babel?: (config: BabelConfig) => BabelConfig;
}

interface FunctionBuildOutput {
    path?: string;
    filename?: string;
}

interface FunctionBuildOptions {
    entry?: string;
    output?: FunctionBuildOutput;
    debug?: boolean;
    define?: DefinePluginOptions;
    webpack?: (config: WebpackConfig) => WebpackConfig;
    babel?: (config: BabelConfig) => BabelConfig;
}

interface CreateBuildPackageOptions {
    cwd: string;
}

interface CreateWatchPackageOptions {
    cwd: string;
}

interface BuildPackageOptions {
    [key: string]: any;
    logs?: boolean;
    debug?: boolean;
    overrides?: {
        tsConfig?: Record<string, any> | ((tsConfig: Record<string, any>) => Record<string, any>);
    };
}

interface WatchPackageOptions {
    [key: string]: any;
}

export function startApp(options: AppBuildOptions, context: any): Promise<void>;
export function buildApp(options: AppBuildOptions, context: any): Promise<void>;
export function buildFunction(options: FunctionBuildOptions, context: any): Promise<void>;
export function watchFunction(options: FunctionBuildOptions, context: any): Promise<void>;

export function createBuildPackage(options: CreateBuildPackageOptions): Promise<void>;
export function createWatchPackage(options: CreateWatchPackageOptions): Promise<void>;
export function buildPackage(options: BuildPackageOptions, context: any): Promise<void>;
export function watchPackage(options: WatchPackageOptions): Promise<void>;

export function traverseLoaders(loaders: Loader[], onLoader: (loader: Loader) => void): void;
