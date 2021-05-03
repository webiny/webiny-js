import { Configuration as WebpackConfig, DefinePlugin } from "webpack";

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

export function startApp(options: AppBuildOptions, context: any): Promise<void>;
export function buildApp(options: AppBuildOptions, context: any): Promise<void>;
export function buildFunction(options: FunctionBuildOptions, context: any): Promise<void>;
export function watchFunction(options: FunctionBuildOptions, context: any): Promise<void>;
