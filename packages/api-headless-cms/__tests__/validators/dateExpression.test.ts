import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import type { CmsModel, CmsModelField } from "~/types";
import { ValidationFeature, CmsModelFieldValidatorRegistry } from "~/features/validation/index.js";

describe("date validators with an expression", () => {
    const container = new Container();
    ValidationFeature.register(container);
    const registry = container.resolve(CmsModelFieldValidatorRegistry);

    const validate = (name: "dateGte" | "dateLte", expression: string, value: string) => {
        return registry.get(name)!.validate({
            value,
            validator: { name, message: "", settings: { expression, type: "date" } },
            context: {} as any,
            field: {} as CmsModelField,
            model: {} as CmsModel
        });
    };

    beforeEach(() => {
        vi.useFakeTimers();
        // 11:00 UTC: UTC-12 is still on 18 October, UTC+14 is already on 20 October.
        vi.setSystemTime(new Date("2026-10-19T11:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("works out an upper limit from the latest date on Earth", async () => {
        // "today-18y" is 2008-10-20 at UTC+14.
        expect(await validate("dateLte", "today-18y", "2008-10-19")).toBe(true);
        expect(await validate("dateLte", "today-18y", "2008-10-20")).toBe(true);
        expect(await validate("dateLte", "today-18y", "2008-10-21")).toBe(false);
        expect(await validate("dateLte", "today-18y", "2010-01-01")).toBe(false);
    });

    it("works out a lower limit from the earliest date on Earth", async () => {
        // "today-100y" is 1926-10-18 at UTC-12.
        expect(await validate("dateGte", "today-100y", "1926-10-19")).toBe(true);
        expect(await validate("dateGte", "today-100y", "1926-10-18")).toBe(true);
        expect(await validate("dateGte", "today-100y", "1926-10-17")).toBe(false);
        expect(await validate("dateGte", "today+1d", "2026-10-19")).toBe(true);
        expect(await validate("dateGte", "today+1d", "2026-10-18")).toBe(false);
    });

    it("compares as a date even when the stored subtype says time", async () => {
        const result = await registry.get("dateLte")!.validate({
            value: "2000-01-01",
            validator: {
                name: "dateLte",
                message: "",
                settings: { expression: "today-18y", type: "time" }
            },
            context: {} as any,
            field: {} as CmsModelField,
            model: {} as CmsModel
        });
        expect(result).toBe(true);
    });

    it("puts the limit into a message's {date}", () => {
        const format = (name: "dateGte" | "dateLte", settings: Record<string, string>) =>
            registry.get(name)!.formatMessage!("Must be on or before {date}.", {
                value: "2010-01-01",
                validator: { name, message: "", settings },
                context: {} as any,
                field: {} as CmsModelField,
                model: {} as CmsModel
            });
        // The same lenient "today" the check uses.
        expect(format("dateLte", { expression: "today-18y", type: "date" })).toBe(
            "Must be on or before 2008-10-20."
        );
        expect(format("dateGte", { expression: "today-100y", type: "date" })).toBe(
            "Must be on or before 1926-10-18."
        );
        expect(format("dateLte", { value: "2000-12-31", type: "date" })).toBe(
            "Must be on or before 2000-12-31."
        );
        // An expression it can't read leaves the message as it is.
        expect(format("dateLte", { expression: "now-18y", type: "date" })).toBe(
            "Must be on or before {date}."
        );
    });

    it("fails a value checked against an expression it can't read", async () => {
        expect(await validate("dateLte", "now-18y", "2000-01-01")).toBe(false);
    });
});
