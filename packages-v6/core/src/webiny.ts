import fs from "fs-extra";
import path from "path";
import { FunctionName, Plugin, Preset } from "./index";
import { createLogger, Logger } from "./utils/logger";
import { getRoot } from "./utils/getRoot";

export interface ProjectDeployConfig {
    resourceName?: (name: string) => string;
    resourceTags?: Record<string, string>;
}

export interface ProjectConfig {
    artifacts?: string;
    presets?: (Preset | Promise<Preset>)[];
    plugins?: Plugin[];
    deploy?: (env: string) => ProjectDeployConfig;
}

interface BuildAdmin {
    watch?: boolean;
}

interface BuildApi {
    watch?: boolean;
}

export interface Webiny {
    // Build methods
    buildApi(params: BuildApi): Promise<void>;
    buildAdmin(params: BuildAdmin): Promise<void>;
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
    getEnv(): string;
    getPlugins(): Plugin[];
    setLogger(logger: Logger): void;
    logger: Logger;
}

export interface ProjectConfigFactory {
    (options: unknown): ProjectConfig;
}

async function loadPluginsFromPresets(presets: ProjectConfig["presets"]) {
    if (!presets) {
        return [];
    }

    const resolvedPresets = await Promise.all(presets);

    return resolvedPresets.reduce<Plugin[]>(
        (plugins, preset) => [...plugins, ...preset.plugins],
        []
    );
}

function deduplicatePlugins(plugins: Plugin[]) {
    return plugins.reduce<Plugin[]>((plugins, plugin) => {
        if (plugins.find(pl => pl.name === plugin.name)) {
            console.warn(
                `WARNING: We've detected a duplicate instance of "${plugin.name}" plugin! Only the first plugin instance will be used.`
            );
            return plugins;
        }
        return [...plugins, plugin];
    }, []);
}

interface WebinyOptions {
    env?: string;
    debug?: boolean;
}

let webiny: Webiny;

export const useWebiny = () => {
    if (!webiny) {
        throw Error(`Webiny is not initialized! Initialize Webiny before using it.`);
    }
    return webiny;
};

export async function initializeWebiny(options: WebinyOptions) {
    // Root project directory
    const root = getRoot();

    // Track loaded .env files
    const loadedEnvFiles: Record<string, boolean> = {};

    // Default output directory
    let output = "";

    // Create default logger
    let logger: Logger = createLogger(options.debug);

    // Project plugins
    let plugins: Plugin[] = [];

    webiny = {
        resolve(...paths: string[]) {
            return path.resolve(root, ...paths);
        },
        async buildAdmin({ watch }) {
            const { buildAdmin } = await import("./build/admin");
            return buildAdmin({ watch });
        },
        buildApi(): Promise<void> {
            return Promise.resolve(undefined);
        },
        buildWebsite(): Promise<void> {
            return Promise.resolve(undefined);
        },
        deployAdmin(): Promise<void> {
            return Promise.resolve(undefined);
        },
        deployAll(): Promise<void> {
            return Promise.resolve(undefined);
        },
        deployApi(): Promise<void> {
            return Promise.resolve(undefined);
        },
        deployStorage(): Promise<void> {
            return Promise.resolve(undefined);
        },
        deployWebsite(): Promise<void> {
            return Promise.resolve(undefined);
        },
        getAdminArtifactPath(): string {
            return webiny.resolve(output, "dist", "admin");
        },
        getApiArtifactPath(functionName) {
            return webiny.resolve(output, "dist", "api", functionName);
        },
        getEnv() {
            return options.env;
        },
        getOutputPath() {
            return output;
        },
        getPlugins(): Plugin[] {
            return plugins;
        },
        getWebsiteArtifactPath(): string {
            return webiny.resolve(output, "dist", "website");
        },
        get logger(): Logger {
            return logger;
        },
        setLogger(newLogger: Logger) {
            logger = newLogger;
        }
    };

    function loadEnv(filePath: string) {
        if (loadedEnvFiles[filePath]) {
            return;
        }

        if (!fs.existsSync(filePath)) {
            logger.debug(`No environment file found at ${logger.debug.hl(filePath)}.`);
            return;
        }

        try {
            require("dotenv").config({ path: filePath });
            logger.debug(`Loaded environment variables from ${logger.debug.hl(filePath)}.`);
            loadedEnvFiles[filePath] = true;
        } catch (err) {
            if (err instanceof Error) {
                logger.debug(`Could not load env variables from ${logger.debug.hl(filePath)}:`);
                logger.debug(err.message);
                console.log();
            }
        }
    }

    // Initialize project
    const configPath = webiny.resolve("webiny.config.ts");
    logger.debug(`Loading project config from ${logger.debug.hl(configPath)}.`);

    // Load project config
    const config = await import(configPath).then(m => m.default);

    // Load all plugins
    const allPlugins = [
        ...(await loadPluginsFromPresets(config.presets)),
        ...(config.plugins || [])
    ];

    plugins = deduplicatePlugins(allPlugins);

    logger.debug(
        `Found ${logger.debug.hl(plugins.length)} plugins:\n${JSON.stringify(
            plugins.map(pl => pl.name),
            null,
            2
        )}`
    );

    output = config.artifacts || webiny.resolve(".artifacts");
    logger.debug(`Build artifacts will be stored in ${logger.debug.hl(output)}.`);

    // Load ENV variables
    if (options.env) {
        await loadEnv(webiny.resolve(`.env.${options.env}`));
    }
    await loadEnv(webiny.resolve(`.env`));

    return webiny;
}
