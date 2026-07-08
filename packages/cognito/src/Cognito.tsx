import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { Api, Admin, Infra } from "@webiny/project-aws";
import { Await } from "@webiny/react-properties";
import { z } from "zod";

const identityProviderSchema = z.object({
    type: z.enum(["google", "facebook", "amazon", "apple", "oidc"]),
    name: z.string().optional(),
    label: z.string(),
    providerDetails: z.record(z.string(), z.any()),
    idpIdentifiers: z.array(z.string()).optional(),
    attributeMapping: z.record(z.string(), z.string()).optional()
});

const federationSchema = z.object({
    domain: z.string().describe("Cognito User Pool domain prefix."),
    callbackUrls: z.array(z.string()).describe("OAuth callback URLs."),
    logoutUrls: z.array(z.string()).optional(),
    responseType: z.enum(["code", "token"]).default("code"),
    allowCredentialsLogin: z.boolean().default(true),
    identityProviders: z.array(identityProviderSchema)
});

export const Cognito = defineExtension({
    type: "Project/Cognito",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Cognito authentication.",
    paramsSchema: z.object({
        apiConfig: z.string().describe("Path to API configuration.").optional(),
        adminConfig: z.string().describe("Path to Admin configuration.").optional(),
        federation: z
            .union([
                federationSchema,
                z.custom<() => Promise<z.infer<typeof federationSchema>>>(
                    val => typeof val === "function"
                )
            ])
            .optional(),
        mfa: z.boolean().describe("Enable TOTP MFA for all users.").default(false)
    }),
    render: props => {
        const federationProp = props.federation;
        const federationFn = federationProp
            ? typeof federationProp === "function"
                ? federationProp
                : () => Promise.resolve(federationProp)
            : null;

        return (
            <>
                <Infra.EnvVar varName={"REACT_APP_IDP_TYPE"} value={"cognito"} />
                {props.mfa ? <Infra.EnvVar varName={"COGNITO_MFA"} value={"true"} /> : null}

                {/* Api extensions */}
                <Api.Extension
                    src={import.meta.dirname + "/api/CognitoApiFeature.js"}
                    exportName={"CognitoApiFeature"}
                />
                {props.apiConfig ? <Api.Extension src={props.apiConfig} /> : null}

                {/* Admin extensions */}
                <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
                {props.adminConfig ? <Admin.Extension src={props.adminConfig} /> : null}

                {/* Federation infra + admin config */}
                {federationFn ? (
                    <Await fn={federationFn}>
                        {federation => (
                            <>
                                <Infra.EnvVar
                                    varName={"COGNITO_FEDERATION_INFRA_CONFIG"}
                                    value={JSON.stringify({
                                        domain: federation.domain,
                                        callbackUrls: federation.callbackUrls,
                                        logoutUrls: federation.logoutUrls,
                                        identityProviders: federation.identityProviders.map(
                                            idp => ({
                                                type: idp.type,
                                                name: idp.name,
                                                providerDetails: idp.providerDetails,
                                                idpIdentifiers: idp.idpIdentifiers,
                                                attributeMapping: idp.attributeMapping
                                            })
                                        )
                                    })}
                                />
                                <Infra.Core.Pulumi
                                    src={import.meta.dirname + "/infra/CognitoFederationPulumi.js"}
                                />
                                <Admin.BuildParam
                                    paramName={"cognitoFederation"}
                                    value={{
                                        callbackUrls: federation.callbackUrls,
                                        logoutUrls:
                                            federation.logoutUrls || federation.callbackUrls,
                                        responseType: federation.responseType,
                                        allowCredentialsLogin: federation.allowCredentialsLogin,
                                        providers: federation.identityProviders.map(idp => ({
                                            name: idp.name || idp.type,
                                            label: idp.label
                                        }))
                                    }}
                                />
                            </>
                        )}
                    </Await>
                ) : null}
            </>
        );
    }
});
