import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { auroraPostgresClusterParamsSchema } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { createPathResolver } from "@webiny/project";
import {
    ApiAfterBuild,
    DatabaseSetup,
    ProjectDecorator
} from "@webiny/project/extensions/index.js";
import { CorePulumi } from "~/pulumi/extensions/CorePulumi.js";

const p = createPathResolver(import.meta.dirname, "Postgres");

/**
 * The internal `AuroraPostgresCluster` that `<Infra.AuroraPostgres />` renders: the API runs on an
 * Aurora PostgreSQL Serverless v2 database the core app creates (`AddCorePostgres`), which reads
 * these params through `getPostgresConfigFromExtension`.
 */
export const AuroraPostgresCluster = defineExtension({
    type: "Infra/AuroraPostgresCluster",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "The Aurora PostgreSQL Serverless v2 cluster the core app creates (internal).",
    paramsSchema: auroraPostgresClusterParamsSchema,
    render: () => {
        return (
            <>
                <DatabaseSetup setupName="pg" />
                <CoreBeforeDeploy src={p("ValidatePostgresBeforeCoreDeploy.js")} />
                <CorePulumi src={p("AddCorePostgres.js")} />
                {/* Every API function runs the one api bundle: its Postgres entry, with knex + pg. */}
                <ProjectDecorator src={p("ReplaceApiLambdaFnHandlers.js")} />
                <ApiAfterBuild src={p("CopyPgModulesAfterApiBuild.js")} />
            </>
        );
    }
});
