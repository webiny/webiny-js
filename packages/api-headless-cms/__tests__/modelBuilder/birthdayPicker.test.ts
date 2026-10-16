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
            dobRange: fields
                .datetime()
                .label("Date of birth")
                .dateOnly()
                .renderer("birthdayInput", { yearRange: [1900, 2026] }),
            due: fields.datetime().label("Due").dateOnly()
        }));

        expect(field(model, "dob").settings?.type).toBe("date");
        expect(field(model, "dob").renderer).toEqual({ name: "birthday-input", settings: null });
        expect(field(model, "dobRange").renderer).toEqual({
            name: "birthday-input",
            settings: { yearRange: [1900, 2026] }
        });
        expect(field(model, "due").renderer).toBeFalsy();
    });
});
