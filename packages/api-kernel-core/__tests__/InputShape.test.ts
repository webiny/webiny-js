import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { InputShape } from "~/features/kernel/InputShape.js";

describe("InputShape", () => {
    it("lists the keys and the EventBridge discriminators, not the other values", () => {
        const shape = InputShape.from({
            source: "webiny.api",
            "detail-type": "EntryPublished",
            detail: { secret: "do-not-print" }
        });

        expect(String(shape)).toBe(
            '{"keys":["source","detail-type","detail"],"source":"webiny.api","detailType":"EntryPublished"}'
        );
    });

    it("prints a discriminator only when it is a string, cut to 100 characters", () => {
        const shape = InputShape.from({
            source: "x".repeat(150),
            "detail-type": { nested: "value" }
        });
        const summary = JSON.parse(String(shape));

        expect(summary.source).toBe("x".repeat(100));
        expect(summary.detailType).toBeUndefined();
    });

    it("gives only the type for a value that isn't an object", () => {
        expect(String(InputShape.from("raw"))).toBe('{"type":"string"}');
        expect(String(InputShape.from(null))).toBe('{"type":"object"}');
        expect(String(InputShape.from(undefined))).toBe('{"type":"undefined"}');
    });
});
