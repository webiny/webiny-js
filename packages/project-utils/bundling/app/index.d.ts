import { Configuration as WebpackConfig } from "webpack";

type BabelConfig = Record<string, any>;

interface BuildOptions {
    entry?: string;
    openBrowser?: boolean;
    webpack?: (config: WebpackConfig) => WebpackConfig;
    babel?: (config: BabelConfig) => BabelConfig;
}

export function startApp(options: BuildOptions, context: any): Promise<void>;
export function buildApp(options: BuildOptions, context: any): Promise<void>;
