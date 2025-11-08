import React from "react";
// Note: in a real project, these would be imported from `webiny/extensions`
import { Admin, Cli, Infra, Project } from "./packages/webiny/dist/extensions/index.js";

// import { Okta } from "@webiny/okta";

export default () => {
    return (
        <>

            {/* Infra 👇 */}
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Core.Pulumi src={"./extensions/MyCorePulumiHandler.ts"} />
            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />
            <Infra.AwsTags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.AwsTags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />

            {/* CLI 👇 */}
            <Cli.Command src={"./extensions/MyCustomCommand.ts"} />

            {/* Project 👇 */}
            <Project.Telemetry enabled={false} />

            {/*<Security.ApiKeyBeforeCreate src={"./extensions/ApiKeyBeforeCreate.ts"} />*/}

            {/* Cloud infrastructure related extensions. All within the `Infra.` namespace. */}

            {/*<Infra.Api.BeforeDeploy src={"./extensions/myApiBeforeDeploy.ts"} />*/}
            {/*<Infra.Api.BeforeBuild src={"./extensions/myApiBeforeBuild.ts"} />*/}
            {/*<Infra.Api.AfterDeploy src={"./extensions/myApiAfterDeploy.ts"} />*/}
            {/*<Infra.Api.AfterBuild src={"./extensions/myApiAfterBuild.ts"} />*/}


            {/*<Infra.Admin.CustomDomains*/}
            {/*    domains={["my.domain.com"]}*/}
            {/*    sslMethod="sni-only"*/}
            {/*    certificateArn="arn:aws:acm:us-east-1:636962863878:certificate/3baf9092-fb27-4efb-9409-XXXXXXXX"*/}
            {/*/>*/}

            {/*<Infra.BlueGreenDeployments*/}
            {/*    enabled={true}*/}
            {/*    domains={{*/}
            {/*        acmCertificateArn:*/}
            {/*            "arn:aws:acm:us-east-1:636962863878:certificate/3baf9092-fb27-4efb-9409-XXXXXXXX",*/}
            {/*        sslSupportMethod: "sni-only",*/}
            {/*        domains: {*/}
            {/*            api: ["api.bg.webiny.com"],*/}
            {/*            admin: ["admin.bg.webiny.com"],*/}
            {/*            website: ["website.bg.webiny.com"],*/}
            {/*            preview: ["preview.bg.webiny.com"]*/}
            {/*        }*/}
            {/*    }}*/}
            {/*    deployments={[*/}
            {/*        {*/}
            {/*            name: "green",*/}
            {/*            env: "dev",*/}
            {/*            variant: "green"*/}
            {/*        },*/}
            {/*        {*/}
            {/*            name: "blue",*/}
            {/*            env: "dev",*/}
            {/*            variant: "blue"*/}
            {/*        }*/}
            {/*    ]}*/}
            {/*/>*/}



            {/* App (Backend/Admin) related extensions. */}
            {/* Notice the `Admin.` and `Backend.` namespaces. These are the prefixes
                users will use to add their own extensions. */}
            <Admin.Extension src={"./extensions/myAdminExtension.tsx"} />

            {/*<AuditLogs.RetentionPeriod days={90} />*/}
            {/*<AuditLogs.Backend.RetentionPeriod days={90} />*/}
            {/*<AuditLogs.Admin.RetentionPeriod days={90} />*/}

            {/*<Cms.Backend.OnEntryBeforeCreate.../>*/}

            {/*<Backend.Security.Authenticator src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Backend.Cms.OnEntryBeforeCreate src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Backend.Cms.Model src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Backend.Cms.ModelGroup src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Backend.Fm.FileModelModifier src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}
            {/*<Backend.Fm.OnFileBeforeCreate src={"./extensions/myOnEntryBeforeCreate.ts"} />*/}

            {/*Finally, we have these extra extensions that are not even included in the default*/}
            {/*`@webiny/extensions` package. These will most probably always be without any*/}
            {/*namespace prefix, just like the `Okta` extension below.*/}
            {/*<Okta*/}
            {/*    backendSrc={"./extensions/myOktaIdProvider.ts"}*/}
            {/*    adminSrc={"./extensions/myOktaIdProvider.ts"}*/}
            {/*/>*/}
        </>
    );
};
