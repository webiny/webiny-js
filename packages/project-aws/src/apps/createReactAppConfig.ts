import path from "path";
import invariant from "invariant";
import {
    type BuildAppConfigOverrides,
    createBuildAdmin,
    createWatchAdmin
} from "@webiny/build-tools";

export interface RunCommandOptions {
    cwd: string;
    command: string;
    env: string;
    variant: string;

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
    [key: string]: () => Promise<any>;
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

export interface EntryModifier {
    (entry: string): string;
}

export interface ReactAppEnv {
    [key: string]: string | number | boolean | undefined | string[] | number[];
}

export interface CustomEnvModifier {
    (env: ReactAppEnv): ReactAppEnv;
}

export interface ReactAppConfig {
    seal(): { commands: ReactAppCommands };

    babel(modifier: BabelConfigModifier): void;

    entry(modifier: EntryModifier): void;

    customEnv(modifier: CustomEnvModifier): void;

    commands(commands: ReactAppCommandsModifier): void;
}

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;

function createEmptyReactConfig(options: RunCommandOptions): ReactAppConfig {
    const babelModifiers: BabelConfigModifier[] = [];
    const commandsModifiers: ReactAppCommandsModifier[] = [];
    const customEnvModifiers: CustomEnvModifier[] = [];
    const entryModifiers: EntryModifier[] = [];

    const loadEnvVars = async () => {
        // Run all custom env var modifiers.
        const envVars = customEnvModifiers.reduce<ReactAppEnv>(
            (env, modifier) => modifier(env),
            {}
        );
        Object.assign(process.env, envVars);
    };

    const createOverrides = (): BuildAppConfigOverrides => {
        const defaultEntry = path.join(options.cwd, "src", "index.tsx");

        return {
            entry: entryModifiers.reduce((entry, modifier) => modifier(entry), defaultEntry),
            babel(config) {
                return babelModifiers.reduce((config, modifier) => modifier(config), config);
            }
        };
    };

    const commands: ReactAppCommands = {
        async build() {
            invariant(options.env, NO_ENV_MESSAGE);

            await loadEnvVars();

            return createBuildAdmin({ cwd: process.cwd(), overrides: createOverrides() })(options);
        },
        async watch() {
            invariant(options.env, NO_ENV_MESSAGE);

            await loadEnvVars();

            return createWatchAdmin({ cwd: process.cwd(), overrides: createOverrides() })(options);
        }
    };

    return {
        commands(modifier) {
            commandsModifiers.push(modifier);
        },
        babel(modifier) {
            babelModifiers.push(modifier);
        },
        customEnv(modifier: CustomEnvModifier) {
            customEnvModifiers.push(modifier);
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
