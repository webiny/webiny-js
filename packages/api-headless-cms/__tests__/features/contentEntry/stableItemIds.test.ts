import { beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { useHandler } from "~tests/testHelpers/useHandler";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ModelFactory } from "~/features/modelBuilder/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

const MODEL_ID = "stableItemIdsTest";
const ID_PATTERN = /^[a-z0-9]{12}$/;

class TestModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder.private({ modelId: MODEL_ID, name: "Stable Item Ids Test" }).fields(fields => ({
                title: fields.text().label("Title"),
                meta: fields
                    .object()
                    .label("Meta")
                    .fields(f => ({ source: f.text().label("Source") })),
                sections: fields
                    .object()
                    .label("Sections")
                    .list()
                    .fields(f => ({ heading: f.text().label("Heading") })),
                blocks: fields
                    .dynamicZone()
                    .label("Blocks")
                    .list()
                    .template("textBlock", {
                        name: "Text Block",
                        gqlTypeName: "StableIdsTextBlock",
                        icon: { type: "icon", name: "fas/paragraph" },
                        description: "Text",
                        fields: f => ({ body: f.text().label("Body") }),
                        layout: [["body"]]
                    })
            }))
        ];
    }
}

const TestModel = ModelFactory.createImplementation({
    implementation: TestModelImpl,
    dependencies: []
});

/*
 * Every object and dynamic-zone value gets a stable `_id`, so other features (comments,
 * annotations) can point at one item of a list and keep pointing at it across saves.
 */
describe("Stable item ids", () => {
    let container: Container;

    beforeEach(async () => {
        const { handler } = useHandler({
            plugins: [(c: Container) => c.register(TestModel)]
        });
        ({ container } = (await handler({
            path: "/cms/manage",
            headers: { "x-tenant": "root" }
        })) as { container: Container });
    });

    const asSystem = <T>(cb: () => Promise<T>) =>
        container.resolve(IdentityContext).withoutAuthorization(cb);

    const create = async () => {
        const model = (await asSystem(() => container.resolve(GetModelUseCase).execute(MODEL_ID)))
            .value;
        const created = await asSystem(() =>
            container.resolve(CreateEntryUseCase).execute(model, {
                values: {
                    title: "Entry",
                    meta: { source: "web" },
                    sections: [{ heading: "One" }, { heading: "Two" }],
                    blocks: [{ _templateId: "textBlock", body: "Hello" }]
                }
            })
        );
        expect(created.isOk()).toBe(true);
        return { model, entry: created.value };
    };

    it("gives every object and dynamic-zone value an _id on create", async () => {
        const { entry } = await create();
        const values = entry.values as any;

        expect(values.meta._id).toMatch(ID_PATTERN);
        expect(values.sections.map((s: any) => s._id)).toEqual([
            expect.stringMatching(ID_PATTERN),
            expect.stringMatching(ID_PATTERN)
        ]);
        expect(values.sections[0]._id).not.toBe(values.sections[1]._id);
        expect(values.blocks[0]._id).toMatch(ID_PATTERN);
    });

    it("keeps existing ids on update, regenerates duplicates and fills in new items", async () => {
        const { model, entry } = await create();
        const values = entry.values as any;
        const firstId = values.sections[0]._id;

        const updated = await asSystem(() =>
            container.resolve(UpdateEntryUseCase).execute(model, entry.id, {
                values: {
                    ...values,
                    sections: [
                        { _id: firstId, heading: "One" },
                        { _id: firstId, heading: "Copy of one" },
                        { heading: "New" }
                    ]
                }
            })
        );
        expect(updated.isOk()).toBe(true);
        const sections = (updated.value.values as any).sections;

        expect(sections[0]._id).toBe(firstId);
        expect(sections[1]._id).toMatch(ID_PATTERN);
        expect(sections[1]._id).not.toBe(firstId);
        expect(sections[2]._id).toMatch(ID_PATTERN);
        expect((updated.value.values as any).meta._id).toBe(values.meta._id);
    });
});
