import * as pulumi from "@pulumi/pulumi";
import { PulumiApp } from "@webiny/pulumi";

type EnvVariables = Record<string, string | pulumi.Output<string>>;

const variablesRegistry: EnvVariables = {};

export let sealEnvVariables: () => void;

const magicPrefixes = ["WEBINY_", "WEBINY_API_", "WCP_", "OKTA_", "AUTH0_"];

const variablesPromise = new Promise<EnvVariables>(resolve => {
    sealEnvVariables = () => {
        // Apart from a couple of basic environment variables like STAGED_ROLLOUTS_VARIANT and DEBUG,
        // we also take into consideration variables that have `WEBINY_` and `WCP_` prefix in their names.
        const baseVariables = Object.keys(process.env).reduce<EnvVariables>(
            (current, environmentVariableName) => {
                const hasMagicPrefix = magicPrefixes.some(prefix =>
                    environmentVariableName.startsWith(prefix)
                );

                if (hasMagicPrefix && process.env[environmentVariableName] !== undefined) {
                    current[environmentVariableName] = String(process.env[environmentVariableName]);
                }
                return current;
            },
            {
                // STAGED_ROLLOUTS_VARIANT: app.ctx.variant || "",
                // Among other things, this determines the amount of information we reveal on runtime errors.
                // https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
                DEBUG: String(process.env.DEBUG),
                // This flag means that Lambda was deployed using the new Pulumi Apps architecture.
                PULUMI_APPS: "true"
            }
        );

        resolve(Object.assign({}, baseVariables, variablesRegistry));
    };
});

export function getCommonLambdaEnvVariables(): pulumi.Output<EnvVariables> {
    return pulumi.output(variablesPromise);
}

function setCommonLambdaEnvVariables(variables: EnvVariables) {
    Object.assign(variablesRegistry, variables);
}

export interface SetCommonLambdaEnvVariables {
    (variables: EnvVariables): void;
}

export interface WithCommonLambdaEnvVariables {
    /**
     * Set ENV variables that wil be assigned to all Lambda functions in the current Pulumi app.
     */
    setCommonLambdaEnvVariables: SetCommonLambdaEnvVariables;
}

/**
 * Augment the given app with `setCommonLambdaEnvVariables` functionality.
 * @param {PulumiApp} app
 */
export function withCommonLambdaEnvVariables<T extends PulumiApp>(
    app: T
): T & WithCommonLambdaEnvVariables {
    app.decorateProgram<{ setCommonLambdaEnvVariables: typeof setCommonLambdaEnvVariables }>(
        async (program, app) => {
            const output = await program({
                ...app,
                setCommonLambdaEnvVariables
            });

            // Once the program is executed, we need to seal the variables (this will resolve the pulumi.output promise).
            app.addHandler(() => {
                sealEnvVariables();
            });

            return output;
        }
    );

    // Augment the original PulumiApp.
    return {
        ...app,
        setCommonLambdaEnvVariables
    };
}
