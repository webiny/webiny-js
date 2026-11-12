import { describe, expect, it } from "vitest";
import { postgresParamsSchema } from "~/extensions/Postgres.js";
import { Vpc } from "~/extensions/Vpc.js";

describe("<Infra.Postgres> params", () => {
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
                postgresVpcConfig: { securityGroupIds: ["sg-db"], subnetIds: ["subnet-a"] }
            }
        });

        expect(result.success).toBe(true);
        expect(result.data?.useExistingVpc?.postgresVpcConfig).toEqual({
            securityGroupIds: ["sg-db"],
            subnetIds: ["subnet-a"]
        });
    });
});
