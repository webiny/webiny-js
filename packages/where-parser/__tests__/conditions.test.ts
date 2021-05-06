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
            const found = Object.keys(availableConditions).filter(key => {
                return availableConditions[key].key === required;
            });

            expect(found).toHaveLength(1);
        }
    );

    it("should not contain conditions that are not in the list", () => {
        const conditions = Object.keys(availableConditions).map(key => availableConditions[key]);
        for (const c of conditions) {
            const isRequired = requiredConditions.includes(c.key);
            expect(isRequired).toBe(true);
        }
    });

    it("should match available conditions keys to internal ones", () => {
        for (const key in availableConditions) {
            const c = availableConditions[key];
            expect(key).toEqual(c.key);
        }
    });
});
