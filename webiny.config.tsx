import React from "react";
import { Admin, Api, Cli, Infra, Project } from "webiny/extensions";
import { FeatureFlag } from "@webiny/project";
import { MyFeature } from "@/extensions/myFeature/Extension.js";
import { AwsExtensions } from "./webiny.config.aws.js";
import { ServerExtensions } from "./webiny.config.server.js";
import { ApplyDiscountExtension } from "@/extensions/bulkActions/applyDiscount/ApplyDiscountExtension.js";
import { AiContentExtension } from "@/extensions/bulkActions/aiContent/AiContentExtension.js";

/**
 * In this monorepo we develop both hosting types. The CLI bin sets WEBINY_HOSTING_TYPE ("aws" via
 * `webiny`, "server" via `webiny-server`). Shared extensions live here; the hosting-specific block
 * below pulls in AWS-only (webiny.config.aws.tsx) or server-only (webiny.config.server.tsx)
 * extensions so neither leaks into the other hosting type.
 */
const isServer = process.env.WEBINY_HOSTING_TYPE === "server";

export const FeatureFlags = () => (
    <Project.FeatureFlags
        features={{
            remoteComponents: true,
            fileManager: {
                threatDetection: false
            },
            recordLocking: false,
            // In-admin AI assistant in the command palette. Off by default while it settles.
            aiChat: true
        }}
    />
);

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
            <Admin.Extension src={"@/extensions/commandPalette/index.tsx"} />
            {/*<Admin.Extension src={"@/extensions/newEntryWizardDemo/index.tsx"} />*/}

            {/* Bulk actions demo: "Apply Discount" bulk action on Products (API + Admin) */}
            <ApplyDiscountExtension />
            {/* Bulk actions demo: "Generate AI summary" bulk action on Products (API + Admin) */}
            {/* IMPORTANT: commented out until we resolve bulk actions bootstrap! */}
            <FeatureFlag.CanUseMultiTenancy>
                <FeatureFlag.CanUse name="aiPowerups">
                    <AiContentExtension />
                </FeatureFlag.CanUse>
            </FeatureFlag.CanUseMultiTenancy>

            {/*<Admin.Extension src={"@/extensions/AdminTitleLogo/AdminTitleLogo.tsx"} />*/}
            {/*<Admin.Extension src={"/extensions/AdminTheme/AdminTheme.tsx"} />*/}
            {/*<Admin.Extension src={"@/extensions/LexicalPlugin.tsx"} />*/}
            <MyFeature />

            {/* Infra (flavour-agnostic) 👇 */}
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Crypto.Encryption passphrase={"my-passphrase"} />
            {/* Optional server-side pepper folded into every hash (e.g. self-hosted auth passwords). */}
            <Infra.Crypto.Hashing pepper={"my-hashing-pepper"} />
            <Infra.Api.MaxBundleSize size={6291456} />

            {/* Api 👇 */}
            {/*<Api.Route method={"GET"} path={"/my-api-route"} src={"/extensions/MyApiRoute.ts"} />*/}
            {/*<Api.Extension src={"@/extensions/rendererShowcase/RendererShowcaseModel.ts"} />*/}
            {/*<Admin.Extension src={"@/extensions/rendererShowcase/RendererShowcaseModifier.tsx"} />*/}
            {/* Bulk actions demo: Products model (the bulk actions themselves are registered
                by the <ApplyDiscountExtension /> / <AiContentExtension /> components above) */}
            <Api.Extension src={"/extensions/models/ProductCategoryModel.ts"} />
            <Api.Extension src={"/extensions/models/ProductModel.ts"} />
            {/*<Api.Extension src={"/extensions/models/contactSubmission/ContactSubmissionModel.ts"} />*/}
            {/*<Api.Extension src={"/extensions/models/contactSubmission/ContactSubmissionHook.ts"} />*/}
            {/*<Admin.Extension*/}
            {/*    src={"/extensions/models/contactSubmission/EmailEntryListColumn.tsx"}*/}
            {/*/>*/}
            {/*<Api.BuildParam paramName="MY_CUSTOM_BUILD_PARAM" value="customValue" />*/}
            {/*<Api.BuildParam*/}
            {/*    paramName="MY_CUSTOM_BUILD_PARAM-2"*/}
            {/*    value={{ myKey: 2, nested: { foo: "bar" } }}*/}
            {/*/>*/}
            {/*<Admin.BuildParam*/}
            {/*    paramName="MY_CUSTOM_ADMIN_BUILD_PARAM-2"*/}
            {/*    value={{ myKey: 2, nested: { foo: "bar" } }}*/}
            {/*/>*/}
            {/*<Admin.BuildParam paramName="MY_CUSTOM_ADMIN_BUILD_PARAM" value="customAdminValue" />*/}

            {/* Project 👇 */}
            <Project.Telemetry enabled={false} />
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

            {/* Hosting-specific 👇 (AWS: Pulumi + Cognito; Server: Admin.ApiUrl + SelfHostedAuth) */}
            {isServer ? <ServerExtensions /> : <AwsExtensions />}
        </>
    );
};
