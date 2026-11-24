import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { createModelField } from "~/utils/createModelField.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetUniqueFieldValuesUseCase } from "~/features/contentEntry/GetUniqueFieldValues/index.js";

/**
 * Unique values of a text-list field (as the file manager lists file tags) follow every change of
 * the entries: revisions, publishing, the bin, deletes. A count is the number of entries holding the
 * value: repeated in one entry, it counts once. pg answers them from maintained
 * counts; every storage must give the same values.
 */
describe("unique values of a list field", () => {
    const handler = useGraphQLHandler({ path: "manage" });

    const mutation = async (query: string, variables: Record<string, unknown>) => {
        const [body] = await handler.invoke({ body: { query, variables } });
        if (!body.data) {
            throw new Error(JSON.stringify(body.errors || body).slice(0, 600));
        }
        const [name, result] = Object.entries(body.data as Record<string, any>)[0];
        expect(result.error, name).toBeNull();
        return result.data;
    };

    const create = async (title: string, tags: string[]) =>
        mutation(
            `mutation($data: TaggedInput!) { createTagged(data: $data) { data { id entryId } error { message } } }`,
            { data: { values: { title, tags } } }
        );
    const createFrom = async (revision: string, tags: string[]) =>
        mutation(
            `mutation($revision: ID!, $data: TaggedInput) { createTaggedFrom(revision: $revision, data: $data) { data { id entryId } error { message } } }`,
            { revision, data: { values: { tags } } }
        );
    const update = async (revision: string, tags: string[]) =>
        mutation(
            `mutation($revision: ID!, $data: TaggedInput!) { updateTagged(revision: $revision, data: $data) { data { id } error { message } } }`,
            { revision, data: { values: { tags } } }
        );
    const publish = async (revision: string) =>
        mutation(
            `mutation($revision: ID!) { publishTagged(revision: $revision) { data { id } error { message } } }`,
            { revision }
        );
    const unpublish = async (revision: string) =>
        mutation(
            `mutation($revision: ID!) { unpublishTagged(revision: $revision) { data { id } error { message } } }`,
            { revision }
        );
    const remove = async (revision: string, permanently: boolean) =>
        mutation(
            `mutation($revision: ID!, $options: CmsDeleteEntryOptions) { deleteTagged(revision: $revision, options: $options) { data error { message } } }`,
            { revision, options: { permanently } }
        );
    const restore = async (revision: string) =>
        mutation(
            `mutation($revision: ID!) { restoreTaggedFromBin(revision: $revision) { data { id } error { message } } }`,
            { revision }
        );
    const removeMany = async (entries: string[]) =>
        mutation(
            `mutation($entries: [ID!]!) { deleteMultipleTaggeds(entries: $entries) { data { id } error { message } } }`,
            { entries }
        );

    const tags = async (where: Record<string, unknown>) => {
        const container = handler.getContext().container;
        const model = await container.resolve(GetModelUseCase).execute("tagged");
        const result = await container
            .resolve(GetUniqueFieldValuesUseCase)
            .execute(model.value, { fieldId: "tags", where });
        expect(result.isOk()).toBe(true);
        return result.value;
    };
    const latest = () => tags({ latest: true });
    const published = () => tags({ published: true });

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({ manager: handler, models: undefined });
        const [response] = await handler.createContentModelMutation({
            data: {
                modelId: "tagged",
                singularApiName: "Tagged",
                pluralApiName: "Taggeds",
                name: "Tagged",
                group: group.id,
                titleFieldId: "title",
                fields: [
                    createModelField({
                        id: "title",
                        storageId: "text@title",
                        fieldId: "title",
                        type: "text",
                        label: "Title"
                    }),
                    createModelField({
                        id: "tags",
                        storageId: "text@tags",
                        fieldId: "tags",
                        type: "text",
                        label: "Tags",
                        list: true
                    })
                ],
                layout: [["title"], ["tags"]]
            } as any
        });
        expect(response.data.createContentModel.error).toBeNull();
    });

    it("counts the values of the latest and the published revisions", async () => {
        const a = await create("A", ["red", "blue"]);
        const b = await create("B", ["red"]);
        await create("C", ["green"]);
        await publish(a.id);
        await publish(b.id);

        expect(await latest()).toEqual([
            { value: "red", count: 2 },
            { value: "blue", count: 1 },
            { value: "green", count: 1 }
        ]);
        expect(await published()).toEqual([
            { value: "red", count: 2 },
            { value: "blue", count: 1 }
        ]);

        // A new draft revision changes the latest values, not the published ones.
        const a2 = await createFrom(a.id, ["blue", "yellow"]);
        expect(await latest()).toEqual([
            { value: "blue", count: 1 },
            { value: "green", count: 1 },
            { value: "red", count: 1 },
            { value: "yellow", count: 1 }
        ]);
        expect(await published()).toEqual([
            { value: "red", count: 2 },
            { value: "blue", count: 1 }
        ]);

        // "yellow" twice in one entry counts once.
        await update(a2.id, ["yellow", "yellow", "pink"]);
        await publish(a2.id);
        await unpublish(b.id);
        expect(await published()).toEqual([
            { value: "pink", count: 1 },
            { value: "yellow", count: 1 }
        ]);
        expect(await latest()).toEqual([
            { value: "green", count: 1 },
            { value: "pink", count: 1 },
            { value: "red", count: 1 },
            { value: "yellow", count: 1 }
        ]);
        // ...and once per entry across entries.
        await create("D", ["yellow", "yellow"]);
        expect(await latest()).toEqual([
            { value: "yellow", count: 2 },
            { value: "green", count: 1 },
            { value: "pink", count: 1 },
            { value: "red", count: 1 }
        ]);
    });

    it("leaves out entries in the bin and counts them again when restored", async () => {
        const a = await create("A", ["red", "blue"]);
        const b = await create("B", ["red"]);
        const c = await create("C", ["green"]);

        await remove(a.entryId, false);
        expect(await latest()).toEqual([
            { value: "green", count: 1 },
            { value: "red", count: 1 }
        ]);

        await restore(a.entryId);
        expect(await latest()).toEqual([
            { value: "red", count: 2 },
            { value: "blue", count: 1 },
            { value: "green", count: 1 }
        ]);

        await remove(b.id, true);
        await removeMany([a.entryId]);
        expect(await latest()).toEqual([{ value: "green", count: 1 }]);
        await remove(c.id, true);
        expect(await latest()).toEqual([]);
    });

    it("counts every value of entries saved at the same time", async () => {
        await Promise.all(
            Array.from({ length: 30 }, (_, i) => create(`E${i}`, ["hot", i % 2 ? "odd" : "even"]))
        );
        expect(await latest()).toEqual([
            { value: "hot", count: 30 },
            { value: "even", count: 15 },
            { value: "odd", count: 15 }
        ]);
    });
});
