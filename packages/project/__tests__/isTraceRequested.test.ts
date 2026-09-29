import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isTraceRequested } from "~/utils/trace/isTraceRequested.js";

describe("isTraceRequested", () => {
    it("is off when the flag is absent", () => {
        expect(isTraceRequested(["deploy", "--env", "dev"])).toBe(false);
    });

    it("is on for a bare --trace", () => {
        expect(isTraceRequested(["deploy", "--trace"])).toBe(true);
    });

    it("is on for --trace=true", () => {
        expect(isTraceRequested(["deploy", "--trace=true"])).toBe(true);
    });

    it("is off for --trace=false", () => {
        expect(isTraceRequested(["deploy", "--trace=false"])).toBe(false);
    });

    // yargs reads a separated value for a boolean option, so this has to agree with it.
    it("is off for --trace false", () => {
        expect(isTraceRequested(["deploy", "--trace", "false"])).toBe(false);
    });

    it("is on for --trace true", () => {
        expect(isTraceRequested(["deploy", "--trace", "true"])).toBe(true);
    });

    it("is on when --trace is the last argument", () => {
        expect(isTraceRequested(["--trace"])).toBe(true);
    });

    it("does not match a different flag that starts the same way", () => {
        expect(isTraceRequested(["deploy", "--trace-level", "debug"])).toBe(false);
    });

    it("is on for --trace followed by another flag", () => {
        expect(isTraceRequested(["deploy", "--trace", "--env", "dev"])).toBe(true);
    });
});
