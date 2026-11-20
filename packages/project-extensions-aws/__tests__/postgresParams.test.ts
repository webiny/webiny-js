import { describe, expect, it } from "vitest";
import {
    auroraPostgresClusterParamsSchema,
    auroraPostgresParamsSchema as postgresParamsSchema
} from "~/extensions/AuroraPostgresCluster.js";
import { Vpc } from "~/extensions/Vpc.js";

describe("<Infra.AuroraPostgres> params", () => {
    it("accepts no params, so every setting has a default", () => {
        expect(postgresParamsSchema.safeParse({}).success).toBe(true);
    });

    it("accepts capacities in steps of 0.5 and a number of readers", () => {
        const result = postgresParamsSchema.safeParse({
            minCapacity: 0.5,
            maxCapacity: 32,
            readers: 2
        });

        expect(result.success).toBe(true);
    });

    it("rejects a minCapacity above maxCapacity, also against the defaults", () => {
        expect(postgresParamsSchema.safeParse({ minCapacity: 8, maxCapacity: 4 }).success).toBe(
            false
        );
        // maxCapacity defaults to 16.
        expect(postgresParamsSchema.safeParse({ minCapacity: 32 }).success).toBe(false);
    });

    it("rejects negative readers, fractional readers and capacities off the 0.5 steps", () => {
        expect(postgresParamsSchema.safeParse({ readers: -1 }).success).toBe(false);
        expect(postgresParamsSchema.safeParse({ readers: 1.5 }).success).toBe(false);
        expect(postgresParamsSchema.safeParse({ maxCapacity: 3.3 }).success).toBe(false);
    });

    it("rejects a maxCapacity below 1 ACU, but lets minCapacity go down to 0", () => {
        expect(postgresParamsSchema.safeParse({ maxCapacity: 0 }).success).toBe(false);
        expect(postgresParamsSchema.safeParse({ maxCapacity: 0.5 }).success).toBe(false);
        expect(postgresParamsSchema.safeParse({ maxCapacity: 1 }).success).toBe(true);
        expect(postgresParamsSchema.safeParse({ minCapacity: 0, maxCapacity: 1 }).success).toBe(
            true
        );
    });

    it("accepts rdsProxy as a boolean only", () => {
        expect(postgresParamsSchema.safeParse({ rdsProxy: true }).success).toBe(true);
        expect(postgresParamsSchema.safeParse({ rdsProxy: false }).success).toBe(true);
        expect(postgresParamsSchema.safeParse({ rdsProxy: "yes" }).success).toBe(false);
    });

    it("has no poolSize, which is internal", () => {
        const result = postgresParamsSchema.safeParse({ poolSize: 4 });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
    });
});

describe("the internal Aurora cluster's params", () => {
    it("are the public ones, with the same checks", () => {
        expect(
            auroraPostgresClusterParamsSchema.safeParse({
                minCapacity: 0.5,
                maxCapacity: 32,
                readers: 2,
                rdsProxy: true
            }).success
        ).toBe(true);
        expect(
            auroraPostgresClusterParamsSchema.safeParse({ minCapacity: 8, maxCapacity: 4 }).success
        ).toBe(false);
        expect(auroraPostgresClusterParamsSchema.safeParse({ maxCapacity: 3.3 }).success).toBe(
            false
        );
    });

    it("accept a whole-number poolSize from 1 to 64, and reject anything else", () => {
        const schema = auroraPostgresClusterParamsSchema;
        expect(schema.safeParse({ poolSize: 1 }).success).toBe(true);
        expect(schema.safeParse({ poolSize: 16 }).success).toBe(true);
        expect(schema.safeParse({ poolSize: 64 }).success).toBe(true);

        expect(schema.safeParse({ poolSize: 0 }).success).toBe(false);
        expect(schema.safeParse({ poolSize: -1 }).success).toBe(false);
        expect(schema.safeParse({ poolSize: 65 }).success).toBe(false);
        expect(schema.safeParse({ poolSize: 2.5 }).success).toBe(false);
    });
});

describe("<Infra.Vpc useExistingVpc> params", () => {
    const schema = Vpc.def.paramsSchema as Exclude<
        typeof Vpc.def.paramsSchema,
        ((...args: any[]) => unknown) | undefined
    >;

    it("accepts postgresVpcConfig next to the other existing-VPC configs", () => {
        const result = schema.safeParse({
            enabled: true,
            useExistingVpc: {
                lambdaFunctionsVpcConfig: { securityGroupIds: ["sg-1"], subnetIds: ["subnet-1"] },
                postgresVpcConfig: {
                    securityGroupIds: ["sg-db"],
                    subnetIds: ["subnet-a", "subnet-b"]
                }
            }
        });

        expect(result.success).toBe(true);
        expect(result.data?.useExistingVpc?.postgresVpcConfig).toEqual({
            securityGroupIds: ["sg-db"],
            subnetIds: ["subnet-a", "subnet-b"]
        });
    });

    it("rejects a postgresVpcConfig with fewer than two subnets", () => {
        const result = schema.safeParse({
            enabled: true,
            useExistingVpc: {
                lambdaFunctionsVpcConfig: { securityGroupIds: ["sg-1"], subnetIds: ["subnet-1"] },
                postgresVpcConfig: { securityGroupIds: ["sg-db"], subnetIds: ["subnet-a"] }
            }
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("at least two subnets");
    });
});
