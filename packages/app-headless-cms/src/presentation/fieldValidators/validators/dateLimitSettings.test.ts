import { describe, it, expect } from "vitest";
import type { CmsModelField } from "~/types.js";
import {
    dateLimitSettingsFromForm,
    dateLimitSettingsToForm,
    toDateExpression
} from "./dateLimitSettings.js";

const context = (type?: string) => ({
    field: { type: "datetime", settings: type ? { type } : {} } as unknown as CmsModelField
});

describe("date limit settings", () => {
    it("opens a relative limit as an amount, a unit and a direction", () => {
        expect(dateLimitSettingsToForm({ expression: "today-18y" }, context("date"))).toEqual({
            mode: "relative",
            amount: 18,
            unit: "y",
            direction: "before"
        });
        expect(dateLimitSettingsToForm({ expression: "today+1d" }, context("date"))).toEqual({
            mode: "relative",
            amount: 1,
            unit: "d",
            direction: "after"
        });
        expect(dateLimitSettingsToForm({ expression: "today" }, context())).toMatchObject({
            mode: "relative",
            amount: 0
        });
    });

    it("opens a fixed limit as a fixed date", () => {
        expect(dateLimitSettingsToForm({ value: "2000-12-31" }, context("date"))).toEqual({
            value: "2000-12-31",
            mode: "fixed",
            unit: "y",
            direction: "before"
        });
    });

    it("leaves the settings of a time or datetime field as they are", () => {
        expect(dateLimitSettingsToForm({ value: "10:00:00" }, context("time"))).toEqual({
            value: "10:00:00"
        });
    });

    it("saves a relative limit as an expression, without the form's own values", () => {
        expect(
            dateLimitSettingsFromForm({
                mode: "relative",
                value: "2000-12-31",
                amount: 18,
                unit: "y",
                direction: "before"
            })
        ).toEqual({ expression: "today-18y" });
        expect(
            dateLimitSettingsFromForm({
                mode: "relative",
                amount: 0,
                unit: "d",
                direction: "after"
            })
        ).toEqual({ expression: "today" });
    });

    it("saves a fixed limit as a value, dropping an earlier expression", () => {
        expect(
            dateLimitSettingsFromForm({
                mode: "fixed",
                value: "2000-12-31",
                expression: "today-18y",
                amount: 18,
                unit: "y",
                direction: "before"
            })
        ).toEqual({ value: "2000-12-31" });
        // A time or datetime field's form has only the value.
        expect(dateLimitSettingsFromForm({ value: "10:00:00" })).toEqual({ value: "10:00:00" });
    });

    it("round-trips what it opens", () => {
        for (const expression of ["today-18y", "today+3m", "today-100y", "today+1d"]) {
            const form = dateLimitSettingsToForm({ expression }, context("date"));
            expect(dateLimitSettingsFromForm(form)).toEqual({ expression });
        }
    });

    it("builds expressions", () => {
        expect(toDateExpression(18, "y", "before")).toBe("today-18y");
        expect(toDateExpression(2, "m", "after")).toBe("today+2m");
        expect(toDateExpression(0, "y", "before")).toBe("today");
    });
});
