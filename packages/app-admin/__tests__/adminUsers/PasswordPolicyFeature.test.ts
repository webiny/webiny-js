import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { PasswordPolicyFeature } from "~/features/adminUsers/passwordPolicy/index.js";
import type { PasswordPolicy } from "~/features/adminUsers/passwordPolicy/index.js";

const resolvePolicy = (rules: PasswordPolicy.Rules) => {
    const container = new Container();
    PasswordPolicyFeature.register(container, rules);

    return PasswordPolicyFeature.resolve(container).passwordPolicy;
};

describe("PasswordPolicyFeature", () => {
    it("accepts a password that meets every rule", () => {
        const policy = resolvePolicy({
            minimumLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true
        });

        expect(() => policy.validate("Abcdef1!")).not.toThrow();
    });

    it("names the minimum length", () => {
        const policy = resolvePolicy({ minimumLength: 8 });

        expect(() => policy.validate("short")).toThrow("Value requires at least 8 characters.");
    });

    it("reports the first missing character class", () => {
        const policy = resolvePolicy({ requireNumbers: true, requireSymbols: true });

        expect(() => policy.validate("letters")).toThrow("Value must contain a number.");
    });

    it("leaves an empty value to the required validator", () => {
        const policy = resolvePolicy({ minimumLength: 8 });

        expect(() => policy.validate("")).not.toThrow();
        expect(() => policy.validate(undefined)).not.toThrow();
    });

    it("accepts anything when there are no rules", () => {
        const policy = resolvePolicy({});

        expect(() => policy.validate("x")).not.toThrow();
    });
});
