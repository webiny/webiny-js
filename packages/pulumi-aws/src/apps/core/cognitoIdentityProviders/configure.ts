import * as aws from "@pulumi/aws";
import { UserPoolDomainArgs } from "@pulumi/aws/cognito/userPoolDomain";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";
import * as pulumi from "@pulumi/pulumi";
import { PulumiApp, PulumiAppResource, PulumiAppResourceConstructor } from "@webiny/pulumi";
import { getIdpConfig } from "./getIdpConfig";

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
    const region = String(process.env.AWS_REGION);

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

    const providers = [];
    for (const idp of config.identityProviders) {
        providers.push(
            app.addResource(aws.cognito.IdentityProvider, {
                name: idp.type,
                config: getIdpConfig(idp.type, userPool.output.id, idp)
            })
        );
    }

    appClient.config.supportedIdentityProviders([
        "COGNITO",
        ...providers.map(p => p.output.providerType)
    ]);

    appClient.config.allowedOauthScopes(["profile", "email", "openid"]);
    appClient.config.allowedOauthFlows(["implicit", "code"]);
    appClient.config.allowedOauthFlowsUserPoolClient(true);
    appClient.config.callbackUrls(config.callbackUrls);
    appClient.config.logoutUrls(config.logoutUrls ?? config.callbackUrls);
};
