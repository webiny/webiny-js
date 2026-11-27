import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

/*
 * Aurora Serverless v2 capacity is set in Aurora capacity units (ACUs), in steps of 0.5, up to
 * 256. The minimum can go down to 0; the maximum must be at least 1.
 */
export const POSTGRES_DEFAULT_MIN_CAPACITY = 0.5;
export const POSTGRES_DEFAULT_MAX_CAPACITY = 16;
export const POSTGRES_DEFAULT_READERS = 0;
const POSTGRES_MAX_CAPACITY_LIMIT = 256;
const POSTGRES_MAX_CAPACITY_FLOOR = 1;
const POSTGRES_MAX_READERS = 15;

/*
 * Connections the API's web function keeps per execution environment. It matches the requests one
 * environment serves at once (`maxConcurrencyPerEnvironment` in `ApiGraphqlWeb.ts`), so no request
 * waits for a free connection; change both together. The plain Lambda functions serve one request
 * at a time and keep a pool of 1.
 */
export const POSTGRES_DEFAULT_POOL_SIZE = 16;
const POSTGRES_MAX_POOL_SIZE = 64;

const capacitySchema = (min: number, minMessage?: string) =>
    z
        .number()
        .min(min, minMessage)
        .max(POSTGRES_MAX_CAPACITY_LIMIT)
        .refine(value => Number.isInteger(value * 2), {
            message: "Aurora capacity must be a multiple of 0.5."
        });

/* The settings of `<Infra.AuroraPostgres />`, which projects set. */
const auroraPostgresShape = {
    minCapacity: capacitySchema(0)
        .optional()
        .describe(
            `The lowest Aurora Serverless v2 capacity, in ACUs. Default: ${POSTGRES_DEFAULT_MIN_CAPACITY}.`
        ),
    maxCapacity: capacitySchema(
        POSTGRES_MAX_CAPACITY_FLOOR,
        `Aurora Serverless v2 needs a \`maxCapacity\` of at least ${POSTGRES_MAX_CAPACITY_FLOOR} ACU.`
    )
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
        ),
    rdsProxy: z
        .boolean()
        .optional()
        .describe(
            "Put an RDS Proxy in front of the database, which pools the connections of every API function. Default: false."
        )
};

interface CapacityParams {
    minCapacity?: number;
    maxCapacity?: number;
}

const minCapacityNotAboveMax = <TSchema extends z.ZodType<CapacityParams>>(schema: TSchema) =>
    schema.refine(
        params =>
            (params.minCapacity ?? POSTGRES_DEFAULT_MIN_CAPACITY) <=
            (params.maxCapacity ?? POSTGRES_DEFAULT_MAX_CAPACITY),
        {
            message: "`minCapacity` must not be greater than `maxCapacity`.",
            path: ["maxCapacity"]
        }
    );

export const auroraPostgresParamsSchema = minCapacityNotAboveMax(z.object(auroraPostgresShape));

export type AuroraPostgresParams = z.infer<typeof auroraPostgresParamsSchema>;

/*
 * The public settings, plus the ones Webiny sets itself.
 */
export const auroraPostgresClusterParamsSchema = minCapacityNotAboveMax(
    z.object({
        ...auroraPostgresShape,
        poolSize: z
            .number()
            .int()
            .min(1)
            .max(POSTGRES_MAX_POOL_SIZE)
            .optional()
            .describe(
                `The most database connections one execution environment of the API's web function keeps open. It matches the ${POSTGRES_DEFAULT_POOL_SIZE} requests one environment serves at once. The plain Lambda functions serve one request at a time and keep 1. Default: ${POSTGRES_DEFAULT_POOL_SIZE}.`
            )
    })
);

export type AuroraPostgresClusterParams = z.infer<typeof auroraPostgresClusterParamsSchema>;

/**
 * Internal: the Aurora PostgreSQL Serverless v2 cluster the core app creates, and what the API
 * needs to run on it. Projects use `<Infra.AuroraPostgres />`, which renders this. Not in any
 * namespace; exported because `@webiny/project-aws` registers its implementation, which renders
 * the database setup, the deploy checks and the core Pulumi module, and reads its params
 * (`getPostgresConfigFromExtension`).
 */
export const AuroraPostgresCluster = defineExtension({
    type: "Infra/AuroraPostgresCluster",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "The Aurora PostgreSQL Serverless v2 cluster the core app creates (internal).",
    paramsSchema: auroraPostgresClusterParamsSchema,
    render: () => {
        throw new Error(`"Infra.AuroraPostgres" requires the "@webiny/project-aws" package.`);
    }
});
