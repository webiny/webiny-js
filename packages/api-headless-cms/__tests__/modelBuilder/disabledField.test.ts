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

describe("disabled model field", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("marks a field as disabled", async () => {
        const model = await buildModel(container, fields => ({
            title: fields.text().label("Title"),
            externalId: fields.text().label("External ID").disabled()
        }));

        expect(field(model, "externalId").disabled).toBe(true);
        expect(field(model, "title").disabled).toBe(false);
    });

    it("takes an explicit value so it can be toggled from a condition", async () => {
        const model = await buildModel(container, fields => ({
            locked: fields.text().label("Locked").disabled(true),
            open: fields.text().label("Open").disabled(false)
        }));

        expect(field(model, "locked").disabled).toBe(true);
        expect(field(model, "open").disabled).toBe(false);
    });

    it("works on non-text field types and alongside other setters", async () => {
        const model = await buildModel(container, fields => ({
            count: fields.number().label("Count").disabled(),
            flags: fields.text().label("Flags").list().disabled()
        }));

        expect(field(model, "count").disabled).toBe(true);
        expect(field(model, "flags").disabled).toBe(true);
        expect(field(model, "flags").list).toBe(true);
    });

    it("applies to the children of an object field", async () => {
        const model = await buildModel(container, fields => ({
            meta: fields
                .object()
                .label("Meta")
                .fields(inner => ({
                    source: inner.text().label("Source").disabled(),
                    comment: inner.text().label("Comment")
                }))
        }));

        const children = field(model, "meta").settings?.fields ?? [];
        const source = children.find((f: CmsModelField) => f.fieldId === "source")!;
        const comment = children.find((f: CmsModelField) => f.fieldId === "comment")!;

        expect(source.disabled).toBe(true);
        expect(comment.disabled).toBe(false);
    });
});
