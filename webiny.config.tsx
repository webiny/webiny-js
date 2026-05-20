import React from "react";
import { Admin, Api, Cli, Infra, Project } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { MyFeature } from "@/extensions/myFeature/Extension.js";
// import { MyIdpExtension } from "./extensions/idp/okta/MyIdpExtension.js";

export const Extensions = () => {
    return (
        <>
            {/* Admin 👇 */}
            <Admin.Extension src={"@/extensions/previewUrlModifier/index.tsx"} />
            {/*<Admin.Extension src={"@/extensions/fileUrlFormatter/index.tsx"} />*/}
            <Admin.Extension src={"@/extensions/sampleEcommerce/index.tsx"} />
            <Admin.Extension src={"@/extensions/customPageTypes/index.tsx"} />
            <Admin.Extension src={"@/extensions/customPageSettings/index.tsx"} />
            <Admin.Extension src={"@/extensions/customFormFieldType/index.tsx"} />

            {/*<Admin.Extension src={"@/extensions/AdminTitleLogo/AdminTitleLogo.tsx"} />*/}
            {/*<Admin.Extension src={"/extensions/AdminTheme/AdminTheme.tsx"} />*/}
            {/*<Admin.Extension src={"@/extensions/LexicalPlugin.tsx"} />*/}
            <MyFeature />
            {/* Infra 👇 */}
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />
            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />

            <Infra.Encryption passphrase={"my-passphrase"} />
            {/*<Infra.Api.MaxBundleSize size={2359296}  />*/}

            <Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.Aws.Tags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />
            <Infra.Aws.DefaultRegion name={"eu-central-1"} />
            {/*<Api.Route method={"GET"} path={"/my-api-route"} src={"/extensions/MyApiRoute.ts"} />*/}
            {/*<Infra.EnvVar varName="MY_ENV_VAR" value="myValue" />*/}
            {/*<Infra.Api.LambdaFunction*/}
            {/*    functionSrc="/extensions/myLambdaFunction/handler.ts"*/}
            {/*    pulumiSrc="/extensions/myLambdaFunction/pulumi.ts"*/}
            {/*/>*/}
            <Api.Extension src={"/extensions/models/ProductCategoryModel.ts"} />
            <Api.Extension src={"/extensions/models/ProductModel.ts"} />
            <Api.Extension src={"/extensions/models/contactSubmission/ContactSubmissionModel.ts"} />
            <Api.Extension src={"/extensions/models/contactSubmission/ContactSubmissionHook.ts"} />
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
            {/* Example: Environment-based conditional configuration */}
            {/*<Infra.Env.Is env="prod">
                <Infra.Aws.Tags tags={{ ENV: "production" }} />
            </Infra.Env.Is>*/}
            {/*<Infra.Env.Is env={["dev", "staging"]}>
                <Infra.Aws.Tags tags={{ ENV: "non-production" }} />
            </Infra.Env.Is>*/}
            {/*<Infra.Admin.CustomDomains
                domains={["my.domain.com"]}
                sslMethod="sni-only"
                certificateArn="arn:aws:acm:us-east-1:636962863878:certificate/3baf9092-fb27-4efb-9409-XXXXXXXX"
            />

            <Infra.BlueGreenDeployments
                enabled={true}
                domains={{
                    acmCertificateArn:
                        "arn:aws:acm:us-east-1:636962863878:certificate/3baf9092-fb27-4efb-9409-XXXXXXXX",
                    sslSupportMethod: "sni-only",
                    domains: {
                        api: ["api.bg.webiny.com"],
                        admin: ["admin.bg.webiny.com"],
                        website: ["website.bg.webiny.com"],
                        preview: ["preview.bg.webiny.com"]
                    }
                }}
                deployments={[
                    {
                        name: "green",
                        env: "dev",
                        variant: "green"
                    },
                    {
                        name: "blue",
                        env: "dev",
                        variant: "blue"
                    }
                ]}
            />*/}
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
            {/* API */}
            {/*<MyIdpExtension />*/}
            <Cognito />
            {/* Security 👇 */}
            <Api.Extension src={"/extensions/MyApiKey.ts"} />
            <Api.Extension src={"/extensions/MyApiKeyAfterUpdate.ts"} />
            {/* CLI 👇 */}
            <Cli.Command src={"/extensions/MyCustomCommand.ts"} />
            {/* 🚧 WIP 👇 */}
            {/*<AuditLogs.RetentionPeriod days={90} />*/}

            {/* Tasks */}
            <Api.Extension src={"/extensions/tasks/SelfCleaningTask.ts"} />
            {/* Headless CMS */}
            {/* Set to true to compress model fields before storing them in the database. */}
            <Api.Cms.ModelFieldCompression enabled={false} />
            {/* Mailer */}
            <Api.Mailer.Smtp
                host={"smtp.webiny.com"}
                port={587}
                user={"smtp-user"}
                password={process.env.SMTP_PASSWORD || "unknown"}
                from={"Webiny <test@webiny.com>"}
                replyTo={"No-reply <no-reply@webiny.com>"}
            />
        </>
    );
};
