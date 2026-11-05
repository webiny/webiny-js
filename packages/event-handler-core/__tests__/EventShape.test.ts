import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventShape } from "~/features/events/EventShape.js";

describe("EventShape", () => {
    it("lists the keys and the EventBridge discriminators, not the other values", () => {
        const shape = EventShape.from({
            source: "webiny.api",
            "detail-type": "EntryPublished",
            detail: { secret: "do-not-print" }
        });

        expect(String(shape)).toBe(
            '{"keys":["source","detail-type","detail"],"source":"webiny.api","detailType":"EntryPublished"}'
        );
    });

    it("gives only the type for a value that isn't an object", () => {
        expect(String(EventShape.from("raw"))).toBe('{"type":"string"}');
        expect(String(EventShape.from(null))).toBe('{"type":"object"}');
        expect(String(EventShape.from(undefined))).toBe('{"type":"undefined"}');
    });
});
