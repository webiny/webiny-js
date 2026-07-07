import React from "react";
import { Admin, Api, Cli, Infra, Project } from "webiny/extensions";
import { MyFeature } from "@/extensions/myFeature/Extension.js";
import { AwsExtensions } from "./webiny.config.aws.js";
import { ServerExtensions } from "./webiny.config.server.js";

/**
 * In this monorepo we develop both flavours. The CLI bin sets WEBINY_FLAVOUR ("aws" via `webiny`,
 * "server" via `webiny-server`). Shared extensions live here; the flavour-specific block below pulls
 * in AWS-only (webiny.config.aws.tsx) or server-only (webiny.config.server.tsx) extensions so neither
 * leaks into the other flavour.
 */
const isServer = process.env.WEBINY_FLAVOUR === "server";

export const Extensions = () => {
    return (
        <>
            {/* Admin 👇 */}
            <Admin.Extension src={"@/extensions/previewUrlModifier/index.tsx"} />
            {/*<Admin.Extension src={"@/extensions/fileUrlFormatter/index.tsx"} />*/}
            <Admin.Extension src={"@/extensions/sampleEcommerce/index.tsx"} />
            {/*<Admin.Extension src={"@/extensions/saleorEcommerce/index.tsx"} />*/}
            <Admin.Extension src={"@/extensions/customPageTypes/index.tsx"} />
            <Admin.Extension src={"@/extensions/customPageSettings/index.tsx"} />
            <Admin.Extension src={"@/extensions/customFormFieldType/index.tsx"} />
            <Admin.Extension src={"@/extensions/newEntryWizardDemo/index.tsx"} />
            <MyFeature />

            {/* Infra (flavour-agnostic) 👇 */}
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Crypto.Encryption passphrase={"my-passphrase"} />
            {/* Optional server-side pepper folded into every hash (e.g. self-hosted auth passwords). */}
            <Infra.Crypto.Hashing pepper={"my-hashing-pepper"} />

            {/* Api 👇 */}
            <Api.Extension src={"@/extensions/rendererShowcase/RendererShowcaseModel.ts"} />
            <Admin.Extension src={"@/extensions/rendererShowcase/RendererShowcaseModifier.tsx"} />

            {/* Project 👇 */}
            <Project.Telemetry enabled={false} />
            <Project.FeatureFlags
                features={{
                    fileManager: {
                        threatDetection: false
                    },
                    recordLocking: false
                }}
            />
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

            {/* Security 👇 */}
            <Api.Extension src={"/extensions/MyApiKey.ts"} />
            <Api.Extension src={"/extensions/MyApiKeyAfterUpdate.ts"} />

            {/* CLI 👇 */}
            <Cli.Command src={"/extensions/MyCustomCommand.ts"} />

            {/* Tasks 👇 */}
            <Api.Extension src={"/extensions/tasks/SelfCleaningTask.ts"} />

            {/* Headless CMS 👇 */}
            {/* Set to true to compress model fields before storing them in the database. */}
            <Api.Cms.ModelFieldCompression enabled={false} />

            {/* Mailer 👇 */}
            <Api.Mailer.Smtp
                host={"smtp.webiny.com"}
                port={587}
                user={"smtp-user"}
                password={process.env.SMTP_PASSWORD || "unknown"}
                from={"Webiny <test@webiny.com>"}
                replyTo={"No-reply <no-reply@webiny.com>"}
            />

            {/* Flavour-specific 👇 (AWS: Pulumi + Cognito; Server: Admin.ApiUrl + SelfHostedAuth) */}
            {isServer ? <ServerExtensions /> : <AwsExtensions />}
        </>
    );
};
