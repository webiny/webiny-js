import { describe, it, expect } from "vitest";
import { FieldPlugin } from "~/plugins/definitions/FieldPlugin";
import { createFilterUtil } from "./createFilterUtil";

const itemJohn = {
    id: 1,
    text: "john",
    meta: {
        private: true
    }
};
const itemJane = {
    id: 2,
    text: "jane",
    meta: {
        private: true
    }
};
const itemWebiny = {
    id: 3,
    text: "webiny",
    meta: {
        private: false
    }
};

const items: any[] = [itemJohn, itemJane, itemWebiny];

class TestField extends FieldPlugin {
    public static override readonly type: string = "dbDynamodb.filtering.test";
}

const fields = [
    new TestField({
        field: "id"
    }),
    new TestField({
        field: "text"
    }),
    new TestField({
        field: "private",
        path: "meta.private"
    })
];

describe("FilterUtil", () => {
    const filterUtil = createFilterUtil();

    it("should return all items when where is empty", () => {
        const result = filterUtil.filter({ items, where: {}, fields });

        expect(result).toEqual(items);
    });

    it("should filter by equal id", () => {
        const result = filterUtil.filter({
            items,
            where: { id: 1 },
            fields
        });

        expect(result).toEqual([itemJohn]);
    });

    it("should filter by equal text", () => {
        const result = filterUtil.filter({
            items,
            where: { text: "webiny" },
            fields
        });

        expect(result).toEqual([itemWebiny]);
    });

    it("should filter by not equal", () => {
        const result = filterUtil.filter({
            items,
            where: { id_not: 1 },
            fields
        });

        expect(result).toEqual([itemJane, itemWebiny]);
    });

    it("should filter by contains", () => {
        const result = filterUtil.filter({
            items,
            where: { text_contains: "j" },
            fields
        });

        expect(result).toEqual([itemJohn, itemJane]);
    });

    it("should filter by nested object using field path", () => {
        const resultFalse = filterUtil.filter({
            items,
            where: { private: false },
            fields
        });

        expect(resultFalse).toEqual([itemWebiny]);

        const resultTrue = filterUtil.filter({
            items,
            where: { private: true },
            fields
        });

        expect(resultTrue).toEqual([itemJohn, itemJane]);
    });

    it("should filter by gt", () => {
        const result = filterUtil.filter({
            items,
            where: { id_gt: 1 },
            fields
        });

        expect(result).toEqual([itemJane, itemWebiny]);
    });

    it("should filter by gte", () => {
        const result = filterUtil.filter({
            items,
            where: { id_gte: 2 },
            fields
        });

        expect(result).toEqual([itemJane, itemWebiny]);
    });

    it("should filter by lt", () => {
        const result = filterUtil.filter({
            items,
            where: { id_lt: 2 },
            fields
        });

        expect(result).toEqual([itemJohn]);
    });

    it("should filter by lte", () => {
        const result = filterUtil.filter({
            items,
            where: { id_lte: 2 },
            fields
        });

        expect(result).toEqual([itemJohn, itemJane]);
    });

    it("should filter by in", () => {
        const result = filterUtil.filter({
            items,
            where: { id_in: [1, 3] },
            fields
        });

        expect(result).toEqual([itemJohn, itemWebiny]);
    });

    it("should filter by not_in", () => {
        const result = filterUtil.filter({
            items,
            where: { id_not_in: [1, 3] },
            fields
        });

        expect(result).toEqual([itemJane]);
    });

    it("should filter by between", () => {
        const result = filterUtil.filter({
            items,
            where: { id_between: [1, 2] },
            fields
        });

        expect(result).toEqual([itemJohn, itemJane]);
    });

    it("should filter by startsWith", () => {
        const result = filterUtil.filter({
            items,
            where: { text_startsWith: "j" },
            fields
        });

        expect(result).toEqual([itemJohn, itemJane]);
    });

    it("should combine multiple where conditions", () => {
        const result = filterUtil.filter({
            items,
            where: { id_gte: 2, text_startsWith: "j" },
            fields
        });

        expect(result).toEqual([itemJane]);
    });

    it("should skip undefined where values", () => {
        const result = filterUtil.filter({
            items,
            where: { id: undefined, text: "john" },
            fields
        });

        expect(result).toEqual([itemJohn]);
    });

    it("should return empty array when nothing matches", () => {
        const result = filterUtil.filter({
            items,
            where: { id: 999 },
            fields
        });

        expect(result).toEqual([]);
    });
});
