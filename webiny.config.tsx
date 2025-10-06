import React from "react";
// Note: in a real project, these would be imported from `@webiny/extensions`
import { Admin, Cli, Webiny, Infra } from "./packages/project-aws/dist/index.js";

// import { Okta } from "@webiny/okta";

export default () => {
    return (
        <>
            {/*Webiny AWS built-in extensions. Always here, must not be removed.*/}
            <Webiny />

            {/* Cloud infrastructure related extensions. All within the `Infra.` namespace. */}
            {/* For some of the extensions, we expect the user to be familiar with the
            Core, API, and Admin Pulumi apps that we deploy by default. */}
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
            <Infra.ProductionEnvironments environments={["prod", "staging"]} />
            <Infra.Api.BeforeDeploy src={"./extensions/myApiBeforeDeploy.ts"} />
            <Infra.Api.BeforeBuild src={"./extensions/myApiBeforeBuild.ts"} />
            <Infra.Api.AfterDeploy src={"./extensions/myApiAfterDeploy.ts"} />
            <Infra.Api.AfterBuild src={"./extensions/myApiAfterBuild.ts"} />

            <Infra.Core.Pulumi src={"./extensions/myCorePulumiHandler2.ts"} />

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

            <Infra.Vpc enabled={false} />
            <Infra.OpenSearch enabled={false} />
            <Infra.ElasticSearch enabled={false} />
            <Infra.AwsTags tags={{ OWNER: "me", PROJECT: "my-project" }} />
            <Infra.AwsTags tags={{ OWNER2: "me2", PROJECT2: "my-project-2" }} />

            {/* Adding custom CLI commands. These are pretty straight-forward/ */}
            <Cli.Command src={"./extensions/myCustomCommand.ts"} />

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
