import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { rdsProxyParamsSchema } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname, "RdsProxy");

/**
 * `<Infra.RdsProxy enabled />` in an AWS project: the core app puts an RDS Proxy in front of the
 * Postgres database. Its params are read through `getRdsProxyConfigFromExtension`.
 */
export const RdsProxy = defineExtension({
    type: "Infra/RdsProxy",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Put an RDS Proxy in front of the Postgres database (off when absent).",
    paramsSchema: rdsProxyParamsSchema,
    render: props => {
        if (!props.enabled) {
            return null;
        }

        return <CoreBeforeDeploy src={p("EnsurePostgresWithRdsProxy.js")} />;
    }
});
