import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Writable } from "node:stream";
import { createLogger } from "~/createLogger.js";

// Collects every line the logger writes, parsed.
const createDestination = () => {
    const lines: Record<string, any>[] = [];
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            const text = chunk.toString();
            const line = JSON.parse(text);
            lines.push(line);
            callback();
        }
    });
    return { stream, lines };
};

describe("createLogger", () => {
    /*
     * createLogger reads the level from the environment, and the test runner loads the root .env.
     * A level of `fatal` or `silent` there would drop every line these tests write.
     */
    const originalLevel = process.env.WEBINY_API_LOG_LEVEL;

    beforeEach(() => {
        process.env.WEBINY_API_LOG_LEVEL = "info";
    });

    afterEach(() => {
        if (originalLevel === undefined) {
            delete process.env.WEBINY_API_LOG_LEVEL;
            return;
        }
        process.env.WEBINY_API_LOG_LEVEL = originalLevel;
    });

    it("writes an Error logged under `error` with its message and stack", () => {
        const { stream, lines } = createDestination();
        const logger = createLogger(stream);

        logger.error({ error: new Error("disk full") }, "upload failed");

        expect(lines).toHaveLength(1);
        expect(lines[0].msg).toBe("upload failed");
        expect(lines[0].error.message).toBe("disk full");
        expect(lines[0].error.type).toBe("Error");
        expect(lines[0].error.stack).toContain("disk full");
    });

    it("still serializes an Error logged under `err`", () => {
        const { stream, lines } = createDestination();
        const logger = createLogger(stream);

        logger.error({ err: new Error("disk full") }, "upload failed");

        expect(lines[0].err.message).toBe("disk full");
    });

    // pino's serializer marks the error it visits, which throws on a frozen one.
    it("logs a frozen Error instead of throwing", () => {
        const { stream, lines } = createDestination();
        const logger = createLogger(stream);
        const error = new Error("disk full");
        Object.freeze(error);

        logger.error({ error }, "upload failed");

        expect(lines).toHaveLength(1);
        expect(lines[0].error.message).toBe("disk full");
        expect(lines[0].error.type).toBe("Error");
        expect(lines[0].error.stack).toContain("disk full");
    });
});
