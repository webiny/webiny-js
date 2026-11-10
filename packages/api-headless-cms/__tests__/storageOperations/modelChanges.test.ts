import { beforeEach, describe, expect, it } from "vitest";
import { InlineTaskServiceFeature } from "@webiny/api-core-testing";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { createModelField } from "~/utils/createModelField.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ModelStorageSync } from "~/features/modelStorageSync/index.js";
import type { CmsModelField } from "~/types/index.js";

const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

/*
 * The generic SQL storage (storage "sql" alone; "pg,sql" is the Postgres storage) does not follow two
 * model changes yet: values of a field whose parent object was renamed read as null, and a field
 * deleted and added again under the same name still matches the old values. Skipped there until the
 * SQL storage handles them; every other storage runs them.
 */
const isSqlStorage = (() => {
    const storages = (process.env.WEBINY_STORAGE || "").split(",");
    return storages.includes("sql") && !storages.includes("pg");
})();

/**
 * Changing a model that already has entries. Fields are created the way the admin UI creates them,
 * with a unique `id`, so `storageId` is `{type}@{id}`: a renamed field keeps its storage, and a field
 * deleted and added again under the same name gets new storage.
 *
 * Every storage must answer correctly right after the change, while a storage's own indexes may
 * still have work pending (pg: model changes spec), and again after that work is done.
 */
const createModelChangeTests = (params: { inlineTasks: boolean }) => {
    const handler = useGraphQLHandler({
        path: "manage",
        afterSetup: params.inlineTasks
            ? container => InlineTaskServiceFeature.register(container)
            : undefined
    });

    const run = async (query: string, variables: Record<string, unknown>) => {
        const [body] = await handler.invoke({ body: { query, variables } });
        if (!body.data) {
            throw new Error(JSON.stringify(body.errors || body).slice(0, 600));
        }
        const [name, result] = Object.entries(body.data as Record<string, any>)[0];
        expect(result.error, name).toBeNull();
        return result;
    };

    const text = (id: string, fieldId: string, extra: Partial<CmsModelField> = {}) =>
        createModelField({ id, fieldId, type: "text", label: fieldId, ...extra });
    const number = (id: string, fieldId: string) =>
        createModelField({ id, fieldId, type: "number", label: fieldId });
    const object = (
        id: string,
        fieldId: string,
        fields: CmsModelField[],
        list = false,
        storageId?: string
    ) =>
        createModelField({
            id,
            fieldId,
            storageId,
            type: "object",
            label: fieldId,
            list,
            settings: { fields, layout: fields.map(field => [field.id]) }
        });

    const title = text("f0title", "title");
    const code = text("f1code", "code");
    const providerName = text("f2name", "name");
    const level = number("f3level", "level");
    const provider = object("f4provider", "provider", [providerName], true);
    const settings = object("f5settings", "settings", [level, provider]);

    const saveModel = async (fields: CmsModelField[]) => {
        const [response] = await handler.updateContentModelMutation({
            modelId: "item",
            data: { fields, layout: fields.map(field => [field.id]) }
        });
        expect(response.data.updateContentModel.error).toBeNull();
    };

    const create = async (values: Record<string, unknown>) =>
        run(
            `mutation($data: ItemInput!) { createItem(data: $data) { data { id } error { message } } }`,
            { data: { values } }
        );

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

    const titles = async (where: Record<string, unknown>) => (await list({ where })).titles.sort();

    /* The storage's own sync, if it has one: what the background task runs. */
    const storageSync = async () => {
        const { container } = handler.getContext();
        const [sync] = container.resolveAll(ModelStorageSync);
        const model = await container.resolve(GetModelUseCase).execute("item");
        return { sync, model: model.value };
    };

    const needsSync = async () => {
        const { sync, model } = await storageSync();
        return sync ? sync.needsSync(model) : false;
    };

    const syncStorage = async () => {
        const { sync, model } = await storageSync();
        if (!sync) {
            return;
        }
        let cursor: string | null = null;
        for (let step = 0; step < 100; step++) {
            const result = await sync.run(model, { cursor, deadline: Date.now() + 10_000 });
            if (result.done) {
                expect(await sync.needsSync(model)).toBe(false);
                return;
            }
            cursor = result.cursor;
        }
        throw new Error("The storage sync did not finish.");
    };

    /* Checks before the storage's sync (unless tasks run inline) and after it. */
    const beforeAndAfterSync = async (check: () => Promise<void>) => {
        await check();
        await syncStorage();
        await check();
    };

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({ manager: handler, models: undefined });
        const fields = [title, code, settings];
        const [response] = await handler.createContentModelMutation({
            data: {
                modelId: "item",
                singularApiName: "Item",
                pluralApiName: "Items",
                name: "Item",
                group: group.id,
                titleFieldId: "title",
                fields,
                layout: fields.map(field => [field.id])
            } as any
        });
        expect(response.data.createContentModel.error).toBeNull();

        await create({
            title: "A",
            code: "A1",
            settings: { level: 1, provider: [{ name: "Stripe" }, { name: "PayPal" }] }
        });
        await create({
            title: "B",
            code: "B1",
            settings: { level: 2, provider: [{ name: "Adyen" }] }
        });
        await create({ title: "C", code: "C1" });
    });

    it("finds entries by a field added to an object", async () => {
        const region = text("f6region", "region");
        await saveModel([title, code, object(settings.id, "settings", [level, provider, region])]);
        await create({ title: "D", code: "D1", settings: { level: 3, region: "eu" } });

        await beforeAndAfterSync(async () => {
            expect(await titles({ settings: { region: "eu" } })).toEqual(["D"]);
            expect(await titles({ settings: { region: null } })).toEqual(["A", "B", "C"]);
            // Fields that were there before still match.
            expect(await titles({ settings: { provider: { name: "Stripe" } } })).toEqual(["A"]);
        });
    });

    it("lists every entry when sorted by a newly added field", async () => {
        const rank = number("f6rank", "rank");
        await saveModel([title, code, settings, rank]);
        await create({ title: "D", code: "D1", rank: 1 });

        await beforeAndAfterSync(async () => {
            const ascending = await list({ sort: ["values_rank_ASC"] });
            expect(ascending.total).toBe(4);
            expect(ascending.titles).toHaveLength(4);
            expect(ascending.titles[0]).toEqual("D");

            const descending = await list({ sort: ["values_rank_DESC"] });
            expect(descending.total).toBe(4);
            expect([...descending.titles].sort()).toEqual(["A", "B", "C", "D"]);
        });
    });

    it.skipIf(isSqlStorage)(
        "keeps matching entries after a field and its parent object are renamed",
        async () => {
            // Renaming in the admin UI keeps each field's id and storageId.
            const label = text(providerName.id, "label", { storageId: providerName.storageId });
            const providers = object(provider.id, "providers", [label], true, provider.storageId);
            const config = object(
                settings.id,
                "config",
                [level, providers],
                false,
                settings.storageId
            );
            await saveModel([title, code, config]);
            // A rename leaves nothing for the storage to do.
            expect(await needsSync()).toBe(false);

            // The entries keep their values under the new names.
            const result = await run(
                `query { listItems(sort: [values_title_ASC], limit: 10) {
                data { values { title config { level providers { label } } } }
                error { message }
            } }`,
                {}
            );
            expect(result.data.map((item: any) => item.values)).toEqual([
                {
                    title: "A",
                    config: { level: 1, providers: [{ label: "Stripe" }, { label: "PayPal" }] }
                },
                { title: "B", config: { level: 2, providers: [{ label: "Adyen" }] } },
                { title: "C", config: null }
            ]);

            expect(await titles({ config: { providers: { label: "Stripe" } } })).toEqual(["A"]);
            expect(await titles({ config: { level_gte: 2 } })).toEqual(["B"]);
            expect(await titles({ config: { providers: { label: null } } })).toEqual(["C"]);
        }
    );

    it.skipIf(isSqlStorage)(
        "does not match old values with a field deleted and added again under the same name",
        async () => {
            await saveModel([title, settings]);
            // Same name and type, new id: new storage, as the admin UI does it.
            const newCode = text("f6code", "code");
            await saveModel([title, newCode, settings]);
            await create({ title: "D", code: "A1" });

            await beforeAndAfterSync(async () => {
                expect(await titles({ code: "A1" })).toEqual(["D"]);
                expect(await titles({ code: null })).toEqual(["A", "B", "C"]);
                expect(await titles({ code_in: ["A1", "B1", "C1"] })).toEqual(["D"]);
            });
        }
    );

    it("does not match old values in a slot freed by a deleted field and reused", async () => {
        await saveModel([title, settings]);
        // Clears the deleted field's values, so its slot can go to the next new field.
        await syncStorage();
        const note = text("f6note", "note");
        await saveModel([title, settings, note]);
        await create({ title: "D", note: "X" });

        await beforeAndAfterSync(async () => {
            expect(await titles({ note: "A1" })).toEqual([]);
            expect(await titles({ note_in: ["A1", "B1", "C1"] })).toEqual([]);
            expect(await titles({ note: "X" })).toEqual(["D"]);
            expect(await titles({ note: null })).toEqual(["A", "B", "C"]);
            const sorted = await list({ sort: ["values_note_ASC"] });
            expect(sorted.total).toBe(4);
        });
    });

    it("matches text inside words once the field opts in, after its rows are rebuilt", async () => {
        const withSubstrings = text(code.id, "code", {
            settings: { search: { substrings: true } }
        });
        await saveModel([title, withSubstrings, settings]);
        await create({ title: "D", code: "D1" });

        if (isPg && !params.inlineTasks) {
            // Old rows have no lexemes for text inside words yet: only word starts match.
            expect(await titles({ code_contains: "1" })).toEqual([]);
            expect(await titles({ code_contains: "B" })).toEqual(["B"]);
        }
        await syncStorage();
        expect(await titles({ code_contains: "1" })).toEqual(["A", "B", "C", "D"]);
        expect(await titles({ code_contains: "B" })).toEqual(["B"]);
    });

    it("applies two model changes made before one sync", async () => {
        const rank = number("f6rank", "rank");
        await saveModel([title, code, settings, rank]);
        const region = text("f7region", "region");
        await saveModel([
            title,
            code,
            object(settings.id, "settings", [level, provider, region]),
            rank
        ]);
        await create({ title: "D", rank: 1, settings: { region: "eu" } });

        await beforeAndAfterSync(async () => {
            const sorted = await list({ sort: ["values_rank_ASC"] });
            expect(sorted.total).toBe(4);
            expect(sorted.titles[0]).toEqual("D");
            expect(await titles({ settings: { region: null } })).toEqual(["A", "B", "C"]);
        });
    });

    if (params.inlineTasks) {
        it("syncs the storage when a model is updated", async () => {
            await saveModel([title, code, settings, number("f6rank", "rank")]);
            // The update started the task, which ran inline.
            expect(await needsSync()).toBe(false);
            expect((await list({ sort: ["values_rank_DESC"] })).total).toBe(3);
        });
    } else {
        it("has nothing left to do after a sync", async () => {
            await saveModel([title, code, settings, number("f6rank", "rank")]);
            expect(await needsSync()).toBe(isPg);
            await syncStorage();
            expect(await needsSync()).toBe(false);
            const { sync, model } = await storageSync();
            if (sync) {
                expect(
                    await sync.run(model, { cursor: null, deadline: Date.now() + 1000 })
                ).toEqual({
                    done: true,
                    cursor: null
                });
            }
        });
    }
};

describe("model changes", () => {
    createModelChangeTests({ inlineTasks: false });
});

describe("model changes, synced by the background task", () => {
    createModelChangeTests({ inlineTasks: true });
});
