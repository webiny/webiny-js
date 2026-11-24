import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { createModelField } from "~/utils/createModelField.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { ModelStorageSync } from "~/features/modelStorageSync/index.js";
import type { CmsModelField } from "~/types/index.js";

/**
 * Deleting a model and creating one under the same id. A model can only be deleted without entries,
 * so the storage has no entries left for it; what a storage keeps per model besides them (pg:
 * the slot map, value counts and index mode of its scope) must not carry over to the new model.
 */
describe("model deleted and created again", () => {
    const handler = useGraphQLHandler({ path: "manage" });

    const run = async (query: string, variables: Record<string, unknown> = {}) => {
        const [body] = await handler.invoke({ body: { query, variables } });
        if (!body.data) {
            throw new Error(JSON.stringify(body.errors || body).slice(0, 600));
        }
        const [name, result] = Object.entries(body.data as Record<string, any>)[0];
        expect(result.error, name).toBeNull();
        return result;
    };

    const text = (id: string, fieldId: string) =>
        createModelField({ id, fieldId, type: "text", label: fieldId });
    const number = (id: string, fieldId: string) =>
        createModelField({ id, fieldId, type: "number", label: fieldId });

    let groupId: string;

    const createModel = async (fields: CmsModelField[]) => {
        const [response] = await handler.createContentModelMutation({
            data: {
                modelId: "item",
                singularApiName: "Item",
                pluralApiName: "Items",
                name: "Item",
                group: groupId,
                titleFieldId: "title",
                fields,
                layout: fields.map(field => [field.id])
            } as any
        });
        expect(response.data.createContentModel.error).toBeNull();
    };

    const create = async (values: Record<string, unknown>): Promise<string> => {
        const result = await run(
            `mutation($data: ItemInput!) { createItem(data: $data) { data { id } error { message } } }`,
            { data: { values } }
        );
        return result.data.id;
    };

    const list = async (params: { where?: Record<string, unknown>; sort?: string[] }) => {
        const result = await run(
            `query($where: ItemListWhereInput, $sort: [ItemListSorter]) {
                listItems(where: $where, sort: $sort, limit: 100) {
                    data { values { title } }
                    meta { totalCount }
                    error { message }
                }
            }`,
            { where: params.where ? { values: params.where } : undefined, sort: params.sort }
        );
        const titles = (result.data as { values: { title: string } }[]).map(
            item => item.values.title
        );
        return { titles, total: result.meta.totalCount as number };
    };

    const item = async () => {
        await run(`query { listItems(limit: 1) { data { id } error { message } } }`);
        const { container } = handler.getContext();
        const model = await container.resolve(GetModelUseCase).execute("item");
        expect(model.isOk()).toBe(true);
        return { container, model: model.value };
    };

    const needsSync = async () => {
        const { container, model } = await item();
        const [sync] = container.resolveAll(ModelStorageSync);
        return sync ? sync.needsSync(model) : false;
    };

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({ manager: handler, models: undefined });
        groupId = group.id;
        await createModel([text("f0title", "title"), text("f1code", "code")]);
        const ids = [
            await create({ title: "A", code: "red" }),
            await create({ title: "B", code: "blue" })
        ];

        const { container, model } = await item();
        for (const id of ids) {
            const deleted = await container
                .resolve(DeleteEntryUseCase)
                .execute(model, id, { permanently: true });
            expect(deleted.isOk()).toBe(true);
        }
        const [response] = await handler.deleteContentModelMutation({ modelId: "item" });
        expect(response.data.deleteContentModel.error).toBeNull();
    });

    it("starts the new model with nothing left of the old one", async () => {
        // New fields, as the admin UI creates them: new ids, so new storage ids.
        await createModel([
            text("f9title", "title"),
            text("f9note", "note"),
            number("f9rank", "rank")
        ]);
        expect(await needsSync()).toBe(false);

        await create({ title: "C", note: "x", rank: 2 });
        await create({ title: "D", rank: 1 });

        expect(await needsSync()).toBe(false);
        expect(await list({})).toMatchObject({ total: 2 });
        expect((await list({ where: { note: "x" } })).titles).toEqual(["C"]);
        expect(await list({ sort: ["values_rank_ASC"] })).toEqual({ titles: ["D", "C"], total: 2 });
    });

    it("doesn't find old values under a field with the same id", async () => {
        // The same field ids as before (an import of the old definition): the same storage ids.
        await createModel([text("f0title", "title"), text("f1code", "code")]);
        await create({ title: "C", code: "green" });

        expect(await needsSync()).toBe(false);
        expect((await list({ where: { code: "red" } })).titles).toEqual([]);
        expect((await list({ where: { code: "green" } })).titles).toEqual(["C"]);
        expect(await list({ sort: ["values_code_ASC"] })).toEqual({ titles: ["C"], total: 1 });
    });
});
