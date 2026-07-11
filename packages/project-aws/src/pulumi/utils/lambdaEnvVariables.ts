import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import { pickApiRuntimeEnvVariables } from "@webiny/project";

type EnvVariables = Record<string, string | pulumi.Output<string>>;

const variablesRegistry: EnvVariables = {};

if (process.env.DEBUG === "true") {
    variablesRegistry.NODE_OPTIONS = "--enable-source-maps";
}

export let sealEnvVariables: () => void;

const variablesPromise = new Promise<EnvVariables>(resolve => {
    sealEnvVariables = () => {
        // The api runtime allowlist (WEBINY_/WCP_PROJECT_ENVIRONMENT/OKTA_/AUTH0_ + DEBUG) is shared
        // with the self-hosted server flavour — see @webiny/project's pickApiRuntimeEnvVariables.
        const baseVariables: EnvVariables = {
            ...pickApiRuntimeEnvVariables(),
            // This flag means that Lambda was deployed using the new Pulumi Apps architecture.
            PULUMI_APPS: "true"
        };

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
