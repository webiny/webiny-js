import { describe, it, expect } from "vitest";
import { stringifyError } from "~/stringifyError";
import { ResponseHeaders } from "~/ResponseHeaders";

describe("stringifyError", () => {
    it("serializes an error with its fields, applying defaults for missing ones", () => {
        const error = Object.assign(new Error("Boom"), { code: "BOOM", data: { a: 1 } });
        const parsed = JSON.parse(stringifyError(error));

        expect(parsed.message).toBe("Boom");
        expect(parsed.code).toBe("BOOM");
        expect(parsed.data).toEqual({ a: 1 });
        expect(parsed.constructorName).toBe("Error");
    });

    it("falls back to defaults when fields are absent", () => {
        const parsed = JSON.parse(stringifyError({} as Error));

        expect(parsed.name).toBe("No error name");
        expect(parsed.message).toBe("No error message");
        expect(parsed.code).toBe("NO_CODE");
    });
});

describe("ResponseHeaders", () => {
    it("sets and reads headers", () => {
        const headers = ResponseHeaders.create({ "content-type": "application/json" });
        headers.set("x-webiny-version", "5.0.0");

        expect(headers.getHeaders()).toEqual({
            "content-type": "application/json",
            "x-webiny-version": "5.0.0"
        });
    });

    it("accepts a setter function that receives the previous value", () => {
        const headers = ResponseHeaders.create({ "content-type": "text/plain" });
        headers.set("content-type", prev => `${prev}; charset=utf-8`);

        expect(headers.getHeaders()["content-type"]).toBe("text/plain; charset=utf-8");
    });

    it("merges two header sets", () => {
        const a = ResponseHeaders.create({ "content-type": "application/json" });
        const b = ResponseHeaders.create({ "x-webiny-version": "5.0.0" });

        expect(a.merge(b).getHeaders()).toEqual({
            "content-type": "application/json",
            "x-webiny-version": "5.0.0"
        });
    });
});
