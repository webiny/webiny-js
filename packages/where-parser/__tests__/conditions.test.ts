import availableConditions from "../src/conditions";

const requiredConditions = [
    "eq",
    "not_eq",
    "in",
    "not_in",
    "gt",
    "not_gt",
    "gte",
    "not_gte",
    "lt",
    "not_lt",
    "lte",
    "not_lte",
    "contains",
    "not_contains",
    "between",
    "not_between"
];

describe("conditions", () => {
    test.each(requiredConditions)(
        "all required conditions should exist - %s",
        (required: string) => {
            const found = availableConditions.all().filter(c => {
                return c.key === required;
            });

            expect(found).toHaveLength(1);
        }
    );

    it("should not contain conditions that are not in the list", () => {
        const conditions = availableConditions.all();
        for (const c of conditions) {
            const isRequired = requiredConditions.includes(c.key);
            expect(isRequired).toBe(true);
        }
    });
});
