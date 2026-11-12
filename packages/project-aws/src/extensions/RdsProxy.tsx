import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { rdsProxyParamsSchema } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/ApiBuildParam.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname, "RdsProxy");

/*
 * `PG_CMS_DEFAULTS_BUILD_PARAM` of `@webiny/api-headless-cms-pg`: defaults for the `<HeadlessCmsPg>`
 * settings, which an explicit setting there overrides. Not imported, so that every AWS project
 * doesn't install the Postgres CMS storage; a test in each package pins the name.
 */
export const HEADLESS_CMS_PG_DEFAULTS_BUILD_PARAM = "HeadlessCmsPgDefaults";

/*
 * Bitmap hints make the CMS run an extra query per list. Through the proxy, lists are faster
 * without them (about 10 ms in the benchmark), so they default to off.
 */
const HEADLESS_CMS_PG_DEFAULTS_BEHIND_PROXY = { bitmapHints: false };

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

        return (
            <>
                <CoreBeforeDeploy src={p("EnsurePostgresWithRdsProxy.js")} />
                <BuildParam
                    paramName={HEADLESS_CMS_PG_DEFAULTS_BUILD_PARAM}
                    value={HEADLESS_CMS_PG_DEFAULTS_BEHIND_PROXY}
                />
            </>
        );
    }
});
