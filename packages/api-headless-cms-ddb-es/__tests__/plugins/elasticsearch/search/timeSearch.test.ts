import { describe, expect, it } from "vitest";
import { TimeSearch } from "~/elasticsearch/search/timeSearch";
import type { CmsEntryOpenSearchValueSearch } from "~/features/CmsEntryOpenSearchValueSearch";

const timeField = {
    settings: {
        type: "time"
    }
};

const notTimeField = {
    settings: {
        type: "date"
    }
};

describe("timeSearch", () => {
    const search = new TimeSearch();

    const correctValues = [
        ["01:02:03", 3723],
        ["13:45:55", 49555],
        ["23:59:59", 86399]
    ];
    it.each(correctValues)("should transform value correctly", (value, expected) => {
        const result = search.transform({
            field: timeField,
            value
        } as CmsEntryOpenSearchValueSearch.Transform);

        expect(result).toEqual(expected);
    });

    it("should return passed value as it is not time field", () => {
        const result = search.transform({
            field: notTimeField,
            value: "someValue"
        } as CmsEntryOpenSearchValueSearch.Transform);

        expect(result).toEqual("someValue");
    });

    it("should be targeting datetime field", () => {
        expect(search.fieldType).toEqual("datetime");
    });
});
