import React from "react";
import { Api } from "webiny/extensions";
import { Infra } from "webiny/extensions";
import { Project } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

/**
 * AWS-only extensions, rendered by webiny.config.tsx when WEBINY_HOSTING_TYPE !== "standalone".
 * Everything AWS/Pulumi-specific lives here so it never leaks into the standalone flavour.
 */
export const AwsExtensions = () => {
    return (
        <>
            {/* Infra (AWS/Pulumi) 👇 */}
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />
            {/*<Infra.Admin.Pulumi src={"/extensions/adminCustomDomains/AdminCustomDomains.ts"} />*/}
            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />
            <Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.Aws.Tags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />
            <Infra.Aws.DefaultRegion name={"eu-central-1"} />
            <Infra.Api.MaxBundleSize size={6291456} />
            <Infra.Crypto.Encryption passphrase={"my-passphrase"} />
            {/* Optional server-side pepper folded into every hash (e.g. self-hosted auth passwords). */}
            <Infra.Crypto.Hashing pepper={"my-hashing-pepper"} />
            {/*<Infra.Api.LambdaFunction*/}
            {/*    functionSrc="/extensions/myLambdaFunction/handler.ts"*/}
            {/*    pulumiSrc="/extensions/myLambdaFunction/pulumi.ts"*/}
            {/*/>*/}
            {/*<Infra.Admin.CustomDomains*/}
            {/*    domains={["my.domain.com"]}*/}
            {/*    sslMethod="sni-only"*/}
            {/*    certificateArn="arn:aws:acm:us-east-1:636962863878:certificate/XXXX"*/}
            {/*/>*/}

            {/* Api 👇 */}
            <Api.Route method={"GET"} path={"/my-api-route"} src={"/extensions/MyApiRoute.ts"} />
            {/* Written with `:orderId` on purpose: API Gateway needs `{orderId}` and the router
                needs `:orderId`, and the extension converts for each. Either spelling should work. */}
            <Api.Route
                method={"GET"}
                path={"/my-api-echo/:orderId"}
                src={"/extensions/MyApiEchoRoute.ts"}
            />

            {/* Project 👇 */}
            {process.env.WEBINY_CLI_AUTO_INSTALL && (
                <Project.AutoInstall
                    adminUser={{
                        firstName: "Ad",
                        lastName: "Min",
                        email: "admin@webiny.com",
                        password: "12345678"
                    }}
                />
            )}

            {/* Auth: Cognito (AWS-managed IdP). */}
            <Cognito />
        </>
    );
};
