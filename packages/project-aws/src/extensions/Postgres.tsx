import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { postgresParamsSchema } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { createPathResolver } from "@webiny/project";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "Postgres");

/**
 * `<Infra.Postgres />` in an AWS project: the API runs on an Aurora PostgreSQL Serverless v2
 * database. Its params are read through `getPostgresConfigFromExtension`.
 */
export const Postgres = defineExtension({
    type: "Infra/Postgres",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Run the API on an Aurora PostgreSQL Serverless v2 database the core app creates.",
    paramsSchema: postgresParamsSchema,
    render: () => {
        return (
            <>
                <DatabaseSetup setupName="pg" />
                <CoreBeforeDeploy src={p("ValidatePostgresBeforeCoreDeploy.js")} />
            </>
        );
    }
});
