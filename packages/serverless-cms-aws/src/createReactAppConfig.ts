import path from "path";
import invariant from "invariant";
import { Configuration as WebpackConfig } from "webpack";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { createBuildApp, createWatchApp } from "@webiny/project-utils";

export interface RunCommandOptions {
    cwd: string;
    command: string;
    env: string;
    [key: string]: any;
}

export interface ReactAppConfigCustomizerParams {
    options: RunCommandOptions;
    config: ReactAppConfig;
}

export interface ReactAppConfigModifier {
    (params: ReactAppConfigCustomizerParams): void;
}

export interface ReactAppFactoryParams {
    options: RunCommandOptions;
}

export interface ReactAppCommands {
    [key: string]: Function;
}

export interface ReactAppCommandsModifier {
    (commands: ReactAppCommands): ReactAppCommands;
}

export interface ReactAppFactory {
    (params: ReactAppFactoryParams): { commands: ReactAppCommands };
}

export interface BabelConfig {
    [key: string]: any;
}

export interface BabelConfigModifier {
    (config: BabelConfig): BabelConfig;
}

export interface WebpackConfigModifier {
    (config: WebpackConfig): WebpackConfig;
}

export interface EntryModifier {
    (entry: string): string;
}

export interface ReactAppEnv {
    [key: string]: string | number | boolean;
}

export interface ReactAppEnvMap {
    [key: string]: string;
}

export interface CustomEnvModifier {
    (env: ReactAppEnv): ReactAppEnv;
}

export interface PulumiOutput {
    [key: string]: string;
}

export interface PulumiOutputToEnvModifierParams {
    output: PulumiOutput;
    env: ReactAppEnv;
}

export interface PulumiOutputToEnvModifier {
    (params: PulumiOutputToEnvModifierParams): ReactAppEnv;
}

export interface ReactAppConfig {
    seal(): { commands: ReactAppCommands };
    webpack(modifier: WebpackConfigModifier): void;
    babel(modifier: BabelConfigModifier): void;
    entry(modifier: EntryModifier): void;
    customEnv(modifier: CustomEnvModifier): void;
    commands(commands: ReactAppCommandsModifier): void;
    pulumiOutputToEnv(
        app: `apps/${string}`,
        modifier: ReactAppEnvMap | PulumiOutputToEnvModifier
    ): void;
}

export interface Overrides {
    entry: string;
    openBrowser?: boolean;
    webpack: (config: WebpackConfig) => WebpackConfig;
    babel: (config: BabelConfig) => BabelConfig;
}

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;

const NO_API_MESSAGE = (env: string) => {
    return `It seems that the API project application isn't deployed!\nBefore continuing, please deploy it by running the following command: yarn webiny deploy apps/api --env=${env}`;
};

function createEnvModifierFromMap(
    app: `apps/${string}`,
    map: ReactAppEnvMap,
    options: RunCommandOptions
): PulumiOutputToEnvModifier {
    return ({ env }) => {
        const output = getStackOutput({
            folder: app,
            env: options.env,
            map
        }) as ReactAppEnv;

        invariant(output, NO_API_MESSAGE(options.env));

        return { ...env, ...output };
    };
}

function createEmptyReactConfig(options: RunCommandOptions): ReactAppConfig {
    const webpackModifiers: WebpackConfigModifier[] = [];
    const babelModifiers: BabelConfigModifier[] = [];
    const commandsModifiers: ReactAppCommandsModifier[] = [];
    const customEnvModifiers: CustomEnvModifier[] = [];
    const pulumiOutputToEnvModifiers: Array<[`apps/${string}`, PulumiOutputToEnvModifier]> = [];
    const entryModifiers: EntryModifier[] = [];

    const loadEnvVars = () => {
        let envVars = customEnvModifiers.reduce<ReactAppEnv>((env, modifier) => modifier(env), {});

        const outputCache: Map<string, PulumiOutput> = new Map();

        envVars = pulumiOutputToEnvModifiers.reduce<ReactAppEnv>((env, [app, modifier]) => {
            if (!outputCache.has(app)) {
                outputCache.set(app, getStackOutput({ folder: app, env: options.env }));
            }

            return modifier({ output: outputCache.get(app)!, env });
        }, envVars);

        Object.assign(process.env, envVars);
    };

    const createOverrides = (): Overrides => {
        const defaultEntry = path.join(options.cwd, "src", "index.tsx");

        return {
            entry: entryModifiers.reduce((entry, modifier) => modifier(entry), defaultEntry),
            webpack(config) {
                return webpackModifiers.reduce((config, modifier) => modifier(config), config);
            },
            babel(config) {
                return babelModifiers.reduce((config, modifier) => modifier(config), config);
            }
        };
    };

    const commands: ReactAppCommands = {
        build() {
            invariant(options.env, NO_ENV_MESSAGE);

            loadEnvVars();

            return createBuildApp({ cwd: process.cwd(), overrides: createOverrides() })(options);
        },
        watch() {
            invariant(options.env, NO_ENV_MESSAGE);

            loadEnvVars();

            return createWatchApp({ cwd: process.cwd(), overrides: createOverrides() })(options);
        }
    };

    return {
        commands(modifier) {
            commandsModifiers.push(modifier);
        },
        babel(modifier) {
            babelModifiers.push(modifier);
        },
        webpack(modifier) {
            webpackModifiers.push(modifier);
        },
        customEnv(modifier: CustomEnvModifier) {
            customEnvModifiers.push(modifier);
        },
        pulumiOutputToEnv(app, modifier) {
            if (typeof modifier === "function") {
                pulumiOutputToEnvModifiers.push([app, modifier]);
                return;
            }

            pulumiOutputToEnvModifiers.push([
                app,
                createEnvModifierFromMap(app, modifier, options)
            ]);
        },
        entry(modifier) {
            entryModifiers.push(modifier);
        },
        seal() {
            return {
                commands: commandsModifiers.reduce(
                    (commands, modifier) => modifier(commands),
                    commands
                )
            };
        }
    };
}

export function createReactAppConfig(customizer?: ReactAppConfigModifier): ReactAppFactory {
    return ({ options }) => {
        const config = createEmptyReactConfig(options);

        if (typeof customizer === "function") {
            customizer({ options, config });
        }

        // Generate config object to be returned to the CLI
        return config.seal();
    };
}
