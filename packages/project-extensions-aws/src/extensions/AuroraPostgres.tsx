import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/ApiBuildParam.js";
import { HeadlessCmsPg, PG_CMS_DEFAULTS_BUILD_PARAM } from "@webiny/api-headless-cms-pg/project.js";
import { AcoPg } from "@webiny/api-aco-pg/project.js";
import {
    AuroraPostgresCluster,
    type AuroraPostgresClusterParams,
    auroraPostgresParamsSchema
} from "./AuroraPostgresCluster.js";

/*
 * Bitmap hints make the CMS run an extra query per list. Through the proxy, lists are faster
 * without them (about 10 ms in the benchmark), so they default to off. A `bitmapHints` the project
 * sets on `<HeadlessCmsPg />` still wins.
 */
const HEADLESS_CMS_PG_DEFAULTS_BEHIND_PROXY = { bitmapHints: false };

/**
 * Postgres on AWS: Webiny creates an Aurora PostgreSQL Serverless v2 cluster in the core app, and
 * the API, with the Postgres CMS storage and the ACO folder catalog, runs on it. The host, user,
 * database and password come from the core app's outputs. Needs `<Infra.Vpc enabled />`.
 *
 * Renders `<HeadlessCmsPg />` and `<AcoPg />` itself. A project may still render them next to it,
 * e.g. `<HeadlessCmsPg indexMode="lean" />`, and gets one of each.
 */
export const AuroraPostgres = defineExtension({
    type: "Infra/AuroraPostgres",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Run the API on an Aurora PostgreSQL Serverless v2 database the core app creates.",
    paramsSchema: auroraPostgresParamsSchema,
    render: ({ minCapacity, maxCapacity, readers, rdsProxy }) => {
        const cluster: AuroraPostgresClusterParams = {
            minCapacity,
            maxCapacity,
            readers,
            rdsProxy
        };
        // Unset settings are left out, so the cluster's own defaults apply.
        const clusterParams = Object.fromEntries(
            Object.entries(cluster).filter(([, value]) => value !== undefined)
        ) as AuroraPostgresClusterParams;

        return (
            <>
                <AuroraPostgresCluster {...clusterParams} />
                <HeadlessCmsPg />
                <AcoPg />
                {rdsProxy ? (
                    <BuildParam
                        paramName={PG_CMS_DEFAULTS_BUILD_PARAM}
                        value={HEADLESS_CMS_PG_DEFAULTS_BEHIND_PROXY}
                    />
                ) : null}
            </>
        );
    }
});
