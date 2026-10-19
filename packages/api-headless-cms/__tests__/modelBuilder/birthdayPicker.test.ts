import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";
import type { CmsModelField } from "~/types/index.js";

const buildModel = async (container: Container, build: (fields: any) => any) => {
    class TestModelImpl implements ModelFactory.Interface {
        public async execute(builder: ModelFactory.Builder) {
            return [builder.private({ modelId: "testModel", name: "Test Model" }).fields(build)];
        }
    }

    container.registerInstance(ModelFactory, new TestModelImpl());
    const models = await container.resolve(ModelsProvider).list("root");
    return models.find(m => m.modelId === "testModel")!;
};

const field = (model: { fields: CmsModelField[] }, fieldId: string) =>
    model.fields.find(f => f.fieldId === fieldId)!;

describe("birthday picker on a date-only field", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("sets the birthday picker renderer by name", async () => {
        const model = await buildModel(container, fields => ({
            dob: fields.datetime().label("Date of birth").dateOnly().renderer("birthdayInput"),
            due: fields.datetime().label("Due").dateOnly()
        }));

        expect(field(model, "dob").settings?.type).toBe("date");
        expect(field(model, "dob").renderer).toEqual({ name: "birthday-input", settings: null });
        expect(field(model, "due").renderer).toBeFalsy();
    });
});

describe("date limits", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("stores a fixed date as `value` and an expression as `expression`", async () => {
        const model = await buildModel(container, fields => ({
            dob: fields
                .datetime()
                .label("Date of birth")
                .dateOnly()
                .dateGte("1900-01-01")
                .dateLte({ expression: "today-18y" }, "You must be 18 or older.")
                .renderer("birthdayInput")
        }));

        expect(field(model, "dob").validation).toEqual([
            {
                name: "dateGte",
                message: "Date/time is earlier than the provided one.",
                settings: { value: "1900-01-01", type: "date" }
            },
            {
                name: "dateLte",
                message: "You must be 18 or older.",
                settings: { expression: "today-18y", type: "date" }
            }
        ]);
    });

    it("rejects an expression it can't read", async () => {
        await expect(
            buildModel(container, fields => ({
                dob: fields
                    .datetime()
                    .label("Date of birth")
                    .dateOnly()
                    .dateLte({ expression: "now-18y" })
            }))
        ).rejects.toMatchObject({ code: "INVALID_DATE_EXPRESSION" });
    });

    it("rejects an expression on a field that isn't date-only", async () => {
        await expect(
            buildModel(container, fields => ({
                startsAt: fields
                    .datetime()
                    .label("Starts at")
                    .withTimezone()
                    .dateGte({ expression: "today" })
            }))
        ).rejects.toMatchObject({ code: "DATE_EXPRESSION_NOT_ALLOWED" });
    });
});
