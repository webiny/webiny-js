import { describe, expect, it } from "vitest";
import type { CmsModelField } from "~/types";
import { validateDateExpressions } from "~/domain/contentModel/validation/dateExpressions.js";

const dateField = (
    settings: Record<string, any>,
    type = "date"
): Pick<CmsModelField, "fieldId" | "type" | "settings" | "validation"> => ({
    fieldId: "bornOn",
    type: "datetime",
    settings: { type },
    validation: [{ name: "dateLte", message: "Too young.", settings }]
});

describe("date expressions in a model's fields", () => {
    it("accepts fixed dates and valid expressions on a date-only field", () => {
        expect(() => validateDateExpressions(dateField({ value: "2000-12-31" }))).not.toThrow();
        expect(() => validateDateExpressions(dateField({ expression: "today-18y" }))).not.toThrow();
        expect(() => validateDateExpressions(dateField({ value: "14:00" }, "time"))).not.toThrow();
    });

    it("rejects an expression it can't read", () => {
        expect(() => validateDateExpressions(dateField({ expression: "now-18y" }))).toThrow(
            expect.objectContaining({ code: "INVALID_DATE_EXPRESSION" })
        );
    });

    it("rejects an expression on a field that isn't date-only", () => {
        for (const type of ["time", "dateTimeWithTimezone", "dateTimeWithoutTimezone"]) {
            expect(() =>
                validateDateExpressions(dateField({ expression: "today-18y" }, type))
            ).toThrow(expect.objectContaining({ code: "DATE_EXPRESSION_NOT_ALLOWED" }));
        }
    });
});
