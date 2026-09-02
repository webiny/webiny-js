import { describe, it, expect } from "vitest";
import { toSseFrame } from "~/features/http/toSseFrame.js";

describe("toSseFrame", () => {
    it("should wrap a payload in a data record terminated by a blank line", () => {
        expect(toSseFrame({ type: "start" })).toBe('data: {"type":"start"}\n\n');
    });

    it("should be round-trippable by the client-side reader's format", () => {
        // `readServerSentEvents` in @webiny/app splits on the blank line and JSON-parses what follows
        // `data:`. Framing has to match that exactly or events silently never parse.
        const frame = toSseFrame({ tags: ["cat"], description: "A cat" });
        const [record] = frame.split("\n\n");

        expect(JSON.parse(record.replace(/^data: /, ""))).toEqual({
            tags: ["cat"],
            description: "A cat"
        });
    });

    it("should take any payload, not one feature's event union", () => {
        expect(toSseFrame("plain")).toBe('data: "plain"\n\n');
        expect(toSseFrame(42)).toBe("data: 42\n\n");
    });
});
