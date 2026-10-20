import { describe, it, expect } from "vitest";
import { isVpcEnabled } from "~/pulumi/apps/extensions/isVpcEnabled.js";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import { Vpc } from "~/pulumi/extensions/Vpc.js";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

const PROD = true;
const NOT_PROD = false;

describe("isVpcEnabled", () => {
    it("should use a VPC for production when no Infra.Vpc extension is registered", () => {
        expect(isVpcEnabled(undefined, PROD)).toBe(true);
    });

    it("should not use a VPC outside production when no Infra.Vpc extension is registered", () => {
        expect(isVpcEnabled(undefined, NOT_PROD)).toBe(false);
    });

    it("should honour an explicit enabled={false} even for production", () => {
        // The regression this guards: production used to win over the explicit param, so
        // `<Infra.Vpc enabled={false} />` silently did nothing on prod/production.
        expect(isVpcEnabled(false, PROD)).toBe(false);
        expect(isVpcEnabled(false, NOT_PROD)).toBe(false);
    });

    it("should honour an explicit enabled={true} outside production", () => {
        expect(isVpcEnabled(true, NOT_PROD)).toBe(true);
        expect(isVpcEnabled(true, PROD)).toBe(true);
    });

    it("should use a VPC whenever advanced params are given", () => {
        expect(isVpcEnabled({ useVpcEndpoints: true }, NOT_PROD)).toBe(true);
        expect(
            isVpcEnabled(
                {
                    useExistingVpc: {
                        lambdaFunctionsVpcConfig: {
                            securityGroupIds: ["sg-1"],
                            subnetIds: ["subnet-1"]
                        }
                    }
                },
                NOT_PROD
            )
        ).toBe(true);
    });
});

/* Minimal project config exposing just the one method the getter calls. */
const projectConfigWith = (params?: Record<string, unknown>): IProjectConfigModel =>
    ({
        extensionsByType: (type: unknown) =>
            type === Vpc && params ? [{ params }] : ([] as unknown[])
    }) as unknown as IProjectConfigModel;

describe("getVpcConfigFromExtension", () => {
    it("should return undefined when the extension is absent", () => {
        expect(getVpcConfigFromExtension(projectConfigWith())).toBeUndefined();
    });

    it("should map enabled={false} to false", () => {
        // isVpcEnabled relies on this exact value to distinguish "explicitly off" from "absent".
        expect(getVpcConfigFromExtension(projectConfigWith({ enabled: false }))).toBe(false);
    });

    it("should map enabled={true} to true", () => {
        expect(getVpcConfigFromExtension(projectConfigWith({ enabled: true }))).toBe(true);
    });

    it("should return the advanced params when any are given", () => {
        expect(
            getVpcConfigFromExtension(projectConfigWith({ enabled: true, useVpcEndpoints: true }))
        ).toEqual({ useVpcEndpoints: true });
    });

    it("should prefer enabled={false} over advanced params", () => {
        expect(
            getVpcConfigFromExtension(projectConfigWith({ enabled: false, useVpcEndpoints: true }))
        ).toBe(false);
    });
});
