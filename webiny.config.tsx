import React from "react";
import { Admin, Api, Cli, Infra, Project, Security } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
// import { MyIdpExtension } from "./extensions/idp/okta/MyIdpExtension.js";

export const Extensions = () => {
    return (
        <>
            {/*<Admin.Extension src={"/extensions/LexicalPlugin.tsx"} />*/}
            {/* Admin 👇 */}
            {/*<Admin.Extension src={"/extensions/AdminTitleLogo/AdminTitleLogo.tsx"} />*/}
            {/*<Admin.Extension src={"/extensions/AdminTheme/AdminTheme.tsx"} />*/}
            {/*<Admin.BuildParam paramName="ADMIN_CUSTOM_PARAM" value="adminValue" />*/}
            {/*<Admin.BuildParam*/}
            {/*    paramName="ADMIN_CONFIG"*/}
            {/*    value={{ theme: "dark", logo: "https://example.com/logo.png" }}*/}
            {/*/>*/}

            {/* Infra 👇 */}
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />
            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />
            <Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.Aws.Tags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />
            <Infra.Aws.DefaultRegion name={"eu-central-1"} />

            <Api.Extension src={"/extensions/models/ProductCategoryModel.ts"} />
            <Api.Extension src={"/extensions/models/ProductModel.ts"} />
            <Api.Extension src={"/extensions/models/ContactSubmissionModel.ts"} />
            <Api.Extension src={"/extensions/models/ContactSubmissionHook.ts"} />
            <Admin.Extension src={"/extensions/models/EmailTypeEntryListColumn.tsx"} />

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

            {/* CLI 👇 */}
            <Cli.Command src={"/extensions/MyCustomCommand.ts"} />

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

            {/* API */}
            {/*<MyIdpExtension />*/}
            <Cognito />

            {/* Security 👇 */}
            <Api.Extension src={"/extensions/MyApiKey.ts"} />
            <Security.ApiKey.AfterUpdate src={"/extensions/MyApiKeyAfterUpdate.ts"} />

            {/* 🚧 WIP 👇 */}
            {/*<Security.ApiKeyBeforeCreate src={"/extensions/ApiKeyBeforeCreate.ts"} />*/}
            {/*<AuditLogs.RetentionPeriod days={90} />*/}
            {/*<AuditLogs.RetentionPeriod days={90} />*/}
            {/*<AuditLogs.Admin.RetentionPeriod days={90} />*/}

            {/*<Cms.OnEntryBeforeCreate.../>*/}

            {/*<Security.Authenticator src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Cms.OnEntryBeforeCreate src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Cms.Model src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Cms.ModelGroup src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Fm.FileModelModifier src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Fm.OnFileBeforeCreate src={"/extensions/myOnEntryBeforeCreate.ts"} />*/}

            {/*Finally, we have these extra extensions that are not even included in the default*/}
            {/*`webiny/extensions` package. These will most probably always be without any*/}
            {/*namespace prefix, just like the `Okta` extension below.*/}
            {/*<Okta*/}
            {/*    backendSrc={"/extensions/myOktaIdProvider.ts"}*/}
            {/*    adminSrc={"/extensions/myOktaIdProvider.ts"}*/}
            {/*/>*/}
        </>
    );
};
