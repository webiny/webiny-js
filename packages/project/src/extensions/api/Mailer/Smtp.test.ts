import { describe, it, expect } from "vitest";
import { SmtpParamsSchema as schema } from "./SmtpParamsSchema.js";

const validParams = {
    host: "smtp.example.com",
    port: 587,
    user: "smtp-user",
    password: "secret",
    from: "Webiny <test@webiny.com>",
    replyTo: "No-reply <no-reply@webiny.com>"
};

describe("Smtp paramsSchema", () => {
    describe("valid inputs", () => {
        it("accepts a complete valid config", async () => {
            const result = await schema.safeParseAsync(validParams);
            expect(result.success).toBe(true);
        });

        it("accepts config without replyTo (it is optional)", async () => {
            const { replyTo: _, ...params } = validParams;
            const result = await schema.safeParseAsync(params);
            expect(result.success).toBe(true);
        });

        it("accepts bare addr-spec for from and replyTo", async () => {
            const result = await schema.safeParseAsync({
                ...validParams,
                from: "test@webiny.com",
                replyTo: "no-reply@webiny.com"
            });
            expect(result.success).toBe(true);
        });
    });

    describe("react-properties serialization bug", () => {
        // When process.env.SMTP_PASSWORD is undefined at build time,
        // react-properties' buildRoots treats value===undefined as "no value, build from
        // children". The password Property has no children, so buildRoots returns {}.
        // Zod then validates {} against z.string() → "expected string, received object".
        it("password={} reproduces the 'expected string, received object' error", async () => {
            const result = await schema.safeParseAsync({ ...validParams, password: {} });
            expect(result.success).toBe(false);
            const issue = result.error?.issues[0];
            expect(issue?.code).toBe("invalid_type");
            expect(issue?.path).toEqual(["password"]);
            expect(issue?.message).toBe("Invalid input: expected string, received object");
        });
    });

    describe("required string fields", () => {
        it("rejects missing host", async () => {
            const { host: _, ...params } = validParams;
            const result = await schema.safeParseAsync(params);
            expect(result.success).toBe(false);
        });

        it("rejects empty host", async () => {
            const result = await schema.safeParseAsync({ ...validParams, host: "" });
            expect(result.success).toBe(false);
        });

        it("rejects missing user", async () => {
            const { user: _, ...params } = validParams;
            const result = await schema.safeParseAsync(params);
            expect(result.success).toBe(false);
        });

        it("rejects empty user", async () => {
            const result = await schema.safeParseAsync({ ...validParams, user: "" });
            expect(result.success).toBe(false);
        });

        it("rejects missing password", async () => {
            const { password: _, ...params } = validParams;
            const result = await schema.safeParseAsync(params);
            expect(result.success).toBe(false);
        });

        it("rejects empty password", async () => {
            const result = await schema.safeParseAsync({ ...validParams, password: "" });
            expect(result.success).toBe(false);
        });
    });

    describe("port validation", () => {
        it("rejects port 0", async () => {
            const result = await schema.safeParseAsync({ ...validParams, port: 0 });
            expect(result.success).toBe(false);
        });

        it("rejects negative port", async () => {
            const result = await schema.safeParseAsync({ ...validParams, port: -1 });
            expect(result.success).toBe(false);
        });

        it("rejects fractional port", async () => {
            const result = await schema.safeParseAsync({ ...validParams, port: 587.5 });
            expect(result.success).toBe(false);
        });
    });

    describe("email address validation", () => {
        it("rejects invalid from address", async () => {
            const result = await schema.safeParseAsync({ ...validParams, from: "not-an-email" });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Invalid email address.");
        });

        it("rejects invalid replyTo address", async () => {
            const result = await schema.safeParseAsync({
                ...validParams,
                replyTo: "not-an-email"
            });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("Invalid email address.");
        });
    });
});
