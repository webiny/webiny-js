import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { createModelField } from "~/utils/createModelField.js";

const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

/**
 * What filters mean where values are missing or several (list fields, lists of objects): every
 * storage must return the same entries. Negating a list condition means no element matches, and an
 * entry without values matches a negation; `null` matches a missing value as well as an empty one.
 */
describe("filter semantics", () => {
    const handler = useGraphQLHandler({ path: "manage" });

    const run = async (query: string, variables: Record<string, unknown>) => {
        const [body] = await handler.invoke({ body: { query, variables } });
        if (!body.data) {
            throw new Error(JSON.stringify(body.errors || body).slice(0, 600));
        }
        const [name, result] = Object.entries(body.data as Record<string, any>)[0];
        expect(result.error, name).toBeNull();
        return result.data;
    };

    const create = async (values: Record<string, unknown>) =>
        run(
            `mutation($data: ItemInput!) { createItem(data: $data) { data { id } error { message } } }`,
            { data: { values } }
        );

    const titles = async (where: Record<string, unknown>) => {
        const data = await run(
            `query($where: ItemListWhereInput) { listItems(where: $where, limit: 100) { data { values { title } } error { message } } }`,
            { where: { values: where } }
        );
        return (data as { values: { title: string } }[]).map(item => item.values.title).sort();
    };

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({ manager: handler, models: undefined });
        const [response] = await handler.createContentModelMutation({
            data: {
                modelId: "item",
                singularApiName: "Item",
                pluralApiName: "Items",
                name: "Item",
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
                    // Text inside words: opt-in on pg (`labels` has the same values without it).
                    createModelField({
                        id: "tags",
                        storageId: "text@tags",
                        fieldId: "tags",
                        type: "text",
                        label: "Tags",
                        list: true,
                        settings: { search: { substrings: true } }
                    }),
                    createModelField({
                        id: "labels",
                        storageId: "text@labels",
                        fieldId: "labels",
                        type: "text",
                        label: "Labels",
                        list: true
                    }),
                    createModelField({
                        id: "parentId",
                        storageId: "text@parentId",
                        fieldId: "parentId",
                        type: "text",
                        label: "Parent"
                    }),
                    createModelField({
                        id: "steps",
                        storageId: "object@steps",
                        fieldId: "steps",
                        type: "object",
                        label: "Steps",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    id: "stepName",
                                    storageId: "text@stepName",
                                    fieldId: "stepName",
                                    type: "text",
                                    label: "Name"
                                }),
                                createModelField({
                                    id: "teams",
                                    storageId: "object@teams",
                                    fieldId: "teams",
                                    type: "object",
                                    label: "Teams",
                                    list: true,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                id: "teamId",
                                                storageId: "text@teamId",
                                                fieldId: "teamId",
                                                type: "text",
                                                label: "Team"
                                            })
                                        ],
                                        layout: [["teamId"]]
                                    }
                                })
                            ],
                            layout: [["stepName"], ["teams"]]
                        }
                    })
                ],
                layout: [["title"], ["tags"], ["labels"], ["parentId"], ["steps"]]
            } as any
        });
        expect(response.data.createContentModel.error).toBeNull();

        await create({
            title: "A",
            tags: ["red", "blue"],
            labels: ["red", "blue"],
            parentId: "p1",
            steps: [{ stepName: "s1", teams: [{ teamId: "t1" }, { teamId: "t2" }] }]
        });
        await create({
            title: "B",
            tags: ["red"],
            labels: ["red"],
            parentId: null,
            steps: [
                { stepName: "s1", teams: [{ teamId: "t3" }] },
                { stepName: "s2", teams: [] }
            ]
        });
        await create({ title: "C", tags: [], labels: [] });
        await create({ title: "D" });
    });

    it("negates list conditions: no element matches", async () => {
        expect(await titles({ tags_in: ["red"] })).toEqual(["A", "B"]);
        expect(await titles({ tags_not_in: ["red"] })).toEqual(["C", "D"]);
        expect(await titles({ tags_not_in: ["blue"] })).toEqual(["B", "C", "D"]);
        expect(await titles({ tags: "red" })).toEqual(["A", "B"]);
        expect(await titles({ tags_not: "blue" })).toEqual(["B", "C", "D"]);
        expect(await titles({ tags_startsWith: "bl" })).toEqual(["A"]);
        expect(await titles({ tags_not_startsWith: "bl" })).toEqual(["B", "C", "D"]);
    });

    it("matches text inside list elements", async () => {
        expect(await titles({ tags_contains: "lu" })).toEqual(["A"]);
        expect(await titles({ tags_not_contains: "lu" })).toEqual(["B", "C", "D"]);
        // Without substrings, pg matches word starts only.
        expect(await titles({ labels_contains: "blu" })).toEqual(["A"]);
        expect(await titles({ labels_contains: "lu" })).toEqual(isPg ? [] : ["A"]);
        expect(await titles({ labels_not_contains: "lu" })).toEqual(
            isPg ? ["A", "B", "C", "D"] : ["B", "C", "D"]
        );
    });

    it("matches any of a long list of values", async () => {
        const others = Array.from({ length: 200 }, (_, i) => `other${i}`);
        expect(await titles({ parentId_in: [...others, "p1"] })).toEqual(["A"]);
        expect(await titles({ tags_in: [...others, "blue"] })).toEqual(["A"]);
        expect(await titles({ tags_not_in: [...others, "blue"] })).toEqual(["B", "C", "D"]);
        expect(await titles({ steps: { teams: { teamId_in: [...others, "t3"] } } })).toEqual(["B"]);
        expect(await titles({ parentId_in: others })).toEqual([]);
        // Past 1,000 values even an indexed model tests the values row by row.
        const many = Array.from({ length: 1200 }, (_, i) => `other${i}`);
        expect(await titles({ tags_in: [...many, "blue"] })).toEqual(["A"]);
        expect(await titles({ tags_not_in: [...many, "red"] })).toEqual(["C", "D"]);
    });

    it("matches a missing value with null", async () => {
        expect(await titles({ parentId: null })).toEqual(["B", "C", "D"]);
        expect(await titles({ parentId_not: null })).toEqual(["A"]);
        expect(await titles({ parentId_not: "p1" })).toEqual(["B", "C", "D"]);
        expect(await titles({ parentId_not_in: ["p1"] })).toEqual(["B", "C", "D"]);
    });

    it("matches any element of lists of objects in lists of objects", async () => {
        expect(await titles({ steps: { teams: { teamId_in: ["t1", "t3"] } } })).toEqual(["A", "B"]);
        expect(await titles({ steps: { teams: { teamId: "t2" } } })).toEqual(["A"]);
        expect(await titles({ steps: { teams: { teamId_not: "t1" } } })).toEqual(["B", "C", "D"]);
        expect(await titles({ steps: { stepName: "s2" } })).toEqual(["B"]);
    });
});
