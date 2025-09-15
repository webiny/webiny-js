import path from "path";
import invariant from "invariant";
import { getStackOutput } from "@webiny/project";
import { type GetApp } from "@webiny/project/abstractions/index.js";
import { type BuildAppConfigOverrides, createBuildApp, createWatchApp } from "@webiny/build-tools";
import { type PulumiAppModule } from "@webiny/pulumi";
import { type Unwrap } from "@pulumi/pulumi";

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

export type PulumiOutput = PulumiAppModule<any>;

export interface PulumiOutputToEnvModifierParams<T extends PulumiOutput> {
    output: Unwrap<T>;
    env: ReactAppEnv;
}

export interface PulumiOutputToEnvModifier<T extends PulumiOutput = PulumiOutput> {
    (params: PulumiOutputToEnvModifierParams<T>): ReactAppEnv;
}

export interface ReactAppConfig {
    seal(): { commands: ReactAppCommands };

    babel(modifier: BabelConfigModifier): void;

    entry(modifier: EntryModifier): void;

    customEnv(modifier: CustomEnvModifier): void;

    commands(commands: ReactAppCommandsModifier): void;

    pulumiOutputToEnv<T extends PulumiOutput>(
        app: GetApp.AppName,
        modifier: PulumiOutputToEnvModifier<T>
    ): void;
}

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;

const appNotDeployedMessage = (appName: string, env: string) => {
    return `It seems that the ${appName} project application isn't deployed!\nBefore continuing, please deploy it by running the following command: yarn webiny deploy api --env=${env}`;
};

function createEmptyReactConfig(options: RunCommandOptions): ReactAppConfig {
    const babelModifiers: BabelConfigModifier[] = [];
    const commandsModifiers: ReactAppCommandsModifier[] = [];
    const customEnvModifiers: CustomEnvModifier[] = [];
    const pulumiOutputToEnvModifiers: Array<[GetApp.AppName, PulumiOutputToEnvModifier]> = [];
    const entryModifiers: EntryModifier[] = [];

    const loadEnvVars = async () => {
        const outputCache = new Map<string, Unwrap<PulumiOutput>>();

        let envVars: ReactAppEnv = {};

        // First, we load all Pulumi outputs that need to be mapped to env vars.
        for (const i of pulumiOutputToEnvModifiers) {
            const [app, modifier] = i;
            if (!outputCache.has(app)) {
                const output = await getStackOutput({
                    app,
                    env: options.env,
                    variant: options.variant
                });

                invariant(output, appNotDeployedMessage(app, options.env));

                // @ts-expect-error
                outputCache.set(app, output);
            }

            // Now we can safely run the modifier, with the output ready to be used.
            Object.assign(envVars, modifier({ output: outputCache.get(app)!, env: envVars }));
        }

        // Next, we run all custom env var modifiers.
        envVars = customEnvModifiers.reduce<ReactAppEnv>((env, modifier) => modifier(env), envVars);

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

            return createBuildApp({ cwd: process.cwd(), overrides: createOverrides() })(options);
        },
        async watch() {
            invariant(options.env, NO_ENV_MESSAGE);

            await loadEnvVars();

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
        customEnv(modifier: CustomEnvModifier) {
            customEnvModifiers.push(modifier);
        },
        pulumiOutputToEnv(app, modifier) {
            pulumiOutputToEnvModifiers.push([app, modifier as PulumiOutputToEnvModifier]);
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
