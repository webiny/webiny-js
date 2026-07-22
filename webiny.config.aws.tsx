import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

/**
 * AWS-only extensions, rendered by webiny.config.tsx when WEBINY_HOSTING_TYPE !== "server".
 * Everything AWS/Pulumi-specific lives here so it never leaks into the server flavour.
 */
export const AwsExtensions = () => {
    return (
        <>
            {/* Infra (AWS/Pulumi) 👇 */}
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />
            {/*<Infra.Admin.Pulumi src={"/extensions/adminCustomDomains/AdminCustomDomains.ts"} />*/}
            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />
            <Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.Aws.Tags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />
            <Infra.Aws.DefaultRegion name={"eu-central-1"} />
            {/*<Infra.Api.MaxBundleSize size={2359296} />*/}
            {/*<Infra.Api.LambdaFunction*/}
            {/*    functionSrc="/extensions/myLambdaFunction/handler.ts"*/}
            {/*    pulumiSrc="/extensions/myLambdaFunction/pulumi.ts"*/}
            {/*/>*/}
            {/*<Infra.Admin.CustomDomains*/}
            {/*    domains={["my.domain.com"]}*/}
            {/*    sslMethod="sni-only"*/}
            {/*    certificateArn="arn:aws:acm:us-east-1:636962863878:certificate/XXXX"*/}
            {/*/>*/}

            {/* Auth: Cognito (AWS-managed IdP). */}
            <Cognito />
        </>
    );
};
