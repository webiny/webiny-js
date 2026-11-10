import React from "react";
import { z } from "zod";
import { ApiExtension, BuildParam, defineExtension } from "@webiny/project/extensions/index.js";
import { PG_CMS_BUILD_PARAM, type IPgStorageSettings } from "./features/config/abstractions.js";

/*
 * Settings of the Postgres CMS storage. Each one is optional; unset, the storage's default applies.
 * They reach the API as one build param (`HeadlessCmsPg`), which only the CMS storage reads.
 */
const settingsSchema = {
    indexMode: z
        .enum(["lean", "indexed"])
        .optional()
        .describe(
            'Index mode of new models: "lean" (rows unindexed until a model grows) or "indexed" (default).'
        ),
    indexModeTtlMs: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe(
            "Milliseconds a process may use a cached index mode for queries. Default: 30000."
        ),
    estimateTtlMs: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Milliseconds a row estimate is cached; 0 turns the cache off. Default: 60000."),
    fieldBudget: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Indexed columns a single model's own fields may use. Default: 50."),
    countCap: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("A list's total is exact up to this many matches. Default: 10000."),
    slotIndexes: z
        .boolean()
        .optional()
        .describe("false skips the per-column sort indexes (test runs). Default: true."),
    bitmapHints: z
        .boolean()
        .optional()
        .describe(
            "false leaves the planner settings alone when collecting matches (behind RDS Proxy). Default: true."
        ),
    sharedTables: z
        .boolean()
        .optional()
        .describe("true: all tenants share one table set. Default: false.")
};

/**
 * The Postgres CMS storage: entries in a jsonb table with a typed search table, kept in the same
 * transaction. Add it to a project whose API runs on the Postgres SQL storage (`<Infra.Postgres>`,
 * `<Infra.Pglite>`, or Postgres on AWS); without it, that API refuses to start.
 */
export const HeadlessCmsPg = defineExtension({
    type: "Project/HeadlessCmsPg",
    tags: { runtimeContext: "project" },
    description: "Store CMS content in Postgres, with the Postgres-native CMS storage.",
    paramsSchema: z.object(settingsSchema),
    render: ({ indexMode, ...props }) => {
        const settings: IPgStorageSettings = { ...props, defaultIndexMode: indexMode };
        // Unset settings are left out, so the build param holds only what the project sets.
        const value = Object.fromEntries(
            Object.entries(settings).filter(([, setting]) => setting !== undefined)
        );
        return (
            <>
                <ApiExtension
                    src={import.meta.dirname + "/HeadlessCmsPgExtension.js"}
                    exportName={"HeadlessCmsPgExtension"}
                />
                <BuildParam paramName={PG_CMS_BUILD_PARAM} value={value} />
            </>
        );
    }
});
