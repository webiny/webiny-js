import { describe, expect, it } from "vitest";
import type { CmsEntryOpenSearchFieldIndex } from "~/features/CmsEntryOpenSearchFieldIndex";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex";

const container = createTestContainer();
const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);

describe("numberIndexing", () => {
    const plugin = fieldIndexRegistry.get("number")!;

    const numbers: any[] = [
        [1, 1],
        [4382, 4382],
        [3924032, 3924032],
        [0.1235, 0.1235],
        [1.01, 1.01],
        [15.4300023, 15.4300023],
        [
            [15, 117.08],
            ["15", "117.08"]
        ],
        [
            [15.4300023, 15.4300021],
            ["15.4300023", "15.4300021"]
        ]
    ];
    it.each(numbers)("toIndex should transform %j to %j", (num: any, expected: any) => {
        const field: any = {
            storageId: "number"
        };
        const result = plugin.toIndex({
            value: num,
            field
        } as CmsEntryOpenSearchFieldIndex.ToIndex);

        expect(result.value).toEqual(expected);
    });
    const strings: any[] = [
        ["1", 1],
        ["4382", 4382],
        ["3924032", 3924032],
        ["0.1235", 0.1235],
        ["1.01", 1.01],
        ["15.4300023", 15.4300023],
        [15.4300023, 15.4300023],
        [
            ["15", "117.08"],
            [15, 117.08]
        ],
        [
            ["15.4300023", "15.4300021"],
            [15.4300023, 15.4300021]
        ]
    ];
    it.each(strings)("fromIndex should transform %j back to %j", (str: any, expected: any) => {
        const field: any = {
            storageId: "number"
        };
        const result = plugin.fromIndex({
            value: str,
            field
        } as CmsEntryOpenSearchFieldIndex.FromIndex);

        expect(result).toEqual(expected);
    });
});
