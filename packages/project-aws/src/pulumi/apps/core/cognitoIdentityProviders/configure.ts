import * as aws from "@pulumi/aws";
import { type UserPoolDomainArgs } from "@pulumi/aws/cognito/userPoolDomain.js";
import { type IdentityProviderArgs } from "@pulumi/aws/cognito/index.js";
import * as pulumi from "@pulumi/pulumi";
import {
    type PulumiApp,
    type PulumiAppResource,
    type PulumiAppResourceConstructor
} from "@webiny/pulumi";
import { getIdpConfig } from "./getIdpConfig.js";
import { getEnvVariableAwsRegion } from "~/pulumi/env/awsRegion.js";

export type IdentityAttributeMapping = {
    "custom:id": string;
    username: string;
    email: string;
    family_name: string;
    given_name: string;
    [key: string]: string;
};

export interface CognitoIdentityProvidersConfig {
    domain:
        | string
        | {
              name: UserPoolDomainArgs["domain"];
              certificateArn?: UserPoolDomainArgs["certificateArn"];
          };
    identityProviders: CognitoIdentityProviderConfig[];
    callbackUrls: string[];
    logoutUrls?: string[];
}

export interface CognitoIdentityProviderConfig {
    name?: string;
    type: "google" | "facebook" | "amazon" | "apple" | "oidc";
    providerDetails: IdentityProviderArgs["providerDetails"];
    idpIdentifiers?: IdentityProviderArgs["idpIdentifiers"];
    attributeMapping?: IdentityAttributeMapping;
}

const isString = (value?: any): value is string => {
    return typeof value === "string";
};

export const configureAdminCognitoFederation = (
    app: PulumiApp,
    config: CognitoIdentityProvidersConfig
) => {
    const region = getEnvVariableAwsRegion();

    const userPool = app.resources.userPool as PulumiAppResource<
        PulumiAppResourceConstructor<aws.cognito.UserPool>
    >;

    const appClient = app.resources.userPoolClient as PulumiAppResource<
        PulumiAppResourceConstructor<aws.cognito.UserPoolClient>
    >;

    /**
     * We need to create a user pool domain, which is used to interact with the federated identity providers.
     */
    const userPoolDomain = app.addResource(aws.cognito.UserPoolDomain, {
        name: "cognitoUserPoolDomain",
        config: {
            domain: isString(config.domain) ? config.domain : config.domain.name,
            certificateArn: isString(config.domain) ? undefined : config.domain.certificateArn,
            userPoolId: userPool.output.id
        }
    });

    app.addOutput(
        "cognitoUserPoolDomain",
        pulumi.interpolate`${userPoolDomain.output.domain}.auth.${region}.amazoncognito.com`
    );

    const idpConfigs: aws.cognito.IdentityProviderArgs[] = [];
    const idpOutputs: pulumi.Output<aws.cognito.IdentityProvider>[] = [];

    for (const idp of config.identityProviders) {
        const config = getIdpConfig(idp.type, userPool.output.id, idp);

        // The idea to lowercase the provider name emerged while working on backwards compatibility issue.
        // Basically, in cases where a user used the OIDC provider and did not specify a name, instead of
        // using `OIDC` as the name, we wanted to ensure `oidc` is used. But, what I soon realized is that
        // by simply lowercasing the name, we can avoid the need to check for the provider type and name.
        // And although this will now happen for all providers, it's not a problem since Pulumi requires
        // names to be all lowercase anyway.
        const name = config.providerName.toString().toLowerCase();

        const idpResource = app.addResource(aws.cognito.IdentityProvider, { name, config });
        idpOutputs.push(idpResource.output);

        idpConfigs.push(config);
    }

    appClient.opts.dependsOn = [
        ...(appClient.opts.dependsOn ? (Array.isArray(appClient.opts.dependsOn) ? appClient.opts.dependsOn : [appClient.opts.dependsOn]) : []),
        ...idpOutputs
    ] as pulumi.Input<pulumi.Resource>[];

    appClient.config.supportedIdentityProviders([
        "COGNITO",
        ...idpConfigs.map(config => {
            // For built-in identity providers, we use the type as the name. Only for OIDC,
            // we allow the user to provide a custom name, and we only use the type as a fallback.
            if (config.providerType === "OIDC") {
                return config.providerName;
            }
            return config.providerType;
        })
    ]);

    appClient.config.allowedOauthScopes(["profile", "email", "openid"]);
    appClient.config.allowedOauthFlows(["implicit", "code"]);
    appClient.config.allowedOauthFlowsUserPoolClient(true);
    appClient.config.callbackUrls(config.callbackUrls);
    appClient.config.logoutUrls(config.logoutUrls ?? config.callbackUrls);
};
