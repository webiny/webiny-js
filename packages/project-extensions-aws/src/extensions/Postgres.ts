import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

/*
 * Aurora Serverless v2 capacity is set in Aurora capacity units (ACUs), in steps of 0.5, from 0
 * to 256.
 */
export const POSTGRES_DEFAULT_MIN_CAPACITY = 0.5;
export const POSTGRES_DEFAULT_MAX_CAPACITY = 16;
export const POSTGRES_DEFAULT_READERS = 0;
const POSTGRES_MAX_CAPACITY_LIMIT = 256;
const POSTGRES_MAX_READERS = 15;

const capacitySchema = z
    .number()
    .min(0)
    .max(POSTGRES_MAX_CAPACITY_LIMIT)
    .refine(value => Number.isInteger(value * 2), {
        message: "Aurora capacity must be a multiple of 0.5."
    });

export const postgresParamsSchema = z
    .object({
        minCapacity: capacitySchema
            .optional()
            .describe(
                `The lowest Aurora Serverless v2 capacity, in ACUs. Default: ${POSTGRES_DEFAULT_MIN_CAPACITY}.`
            ),
        maxCapacity: capacitySchema
            .optional()
            .describe(
                `The highest Aurora Serverless v2 capacity, in ACUs. Default: ${POSTGRES_DEFAULT_MAX_CAPACITY}.`
            ),
        readers: z
            .number()
            .int()
            .min(0)
            .max(POSTGRES_MAX_READERS)
            .optional()
            .describe(
                `The number of reader instances next to the writer. Default: ${POSTGRES_DEFAULT_READERS}.`
            )
    })
    .refine(
        params =>
            (params.minCapacity ?? POSTGRES_DEFAULT_MIN_CAPACITY) <=
            (params.maxCapacity ?? POSTGRES_DEFAULT_MAX_CAPACITY),
        {
            message: "`minCapacity` must not be greater than `maxCapacity`.",
            path: ["maxCapacity"]
        }
    );

export type PostgresParams = z.infer<typeof postgresParamsSchema>;

/**
 * Spec of the AWS `Infra/Postgres` extension, used by the shared `Infra` namespace. Webiny creates
 * an Aurora PostgreSQL Serverless v2 cluster in the core app. The implementation, which renders
 * the database setup, the deploy checks and the core Pulumi module, is registered by
 * `@webiny/project-aws`.
 */
export const Postgres = defineExtension({
    type: "Infra/Postgres",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Run the API on an Aurora PostgreSQL Serverless v2 database the core app creates.",
    paramsSchema: postgresParamsSchema,
    render: () => {
        throw new Error(`"Infra.Postgres" requires the "@webiny/project-aws" package.`);
    }
});
