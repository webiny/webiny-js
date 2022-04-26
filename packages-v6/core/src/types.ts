import { Preset } from "./definePreset";
import { FunctionName, Plugin } from "./definePlugin";
import { Logger } from "./utils/logger";

export type {
    WebpackConfigModifier,
    BabelConfigModifier,
    BabelConfig
} from "./artifacts/bundle/config/webpack.config";

export interface ProjectDeployConfig {
    resourceName?: (name: string) => string;
    resourceTags?: Record<string, string>;
}

export interface ProjectConfig {
    artifacts?: string;
    deploy?: (env: string) => ProjectDeployConfig;
    presets?: (Preset | Promise<Preset>)[];
    plugins?: Plugin[];
    telemetry?: boolean;
}

interface BuildAdminParams {
    watch: boolean;
}

interface BuildApiParams {
    watch?: boolean;
}

export interface Webiny {
    // Build methods
    buildApi(params: BuildApiParams): Promise<void>;
    buildAdmin(params: BuildAdminParams): Promise<void>;
    buildWebsite(): Promise<void>;
    // Deploy methods
    deployAll(): Promise<void>;
    deployApi(): Promise<void>;
    deployAdmin(): Promise<void>;
    deployWebsite(): Promise<void>;
    deployStorage(): Promise<void>;
    // Utility methods
    resolve(...paths: string[]): string;
    getOutputPath(): string;
    getApiArtifactPath(functionName: FunctionName): string;
    getAdminArtifactPath(): string;
    getWebsiteArtifactPath(): string;
    getEnv(): string | undefined;
    getPlugins(): Plugin[];
    setLogger(logger: Logger): void;
    logger: Logger;
    telemetry: boolean;
}

export interface ProjectConfigFactory {
    (options: unknown): ProjectConfig;
}

export interface WebinyOptions {
    env?: string;
    debug?: boolean;
}
