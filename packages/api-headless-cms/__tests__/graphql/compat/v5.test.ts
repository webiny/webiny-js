import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { getModel as getMockModel, setupGroupAndModels } from "~tests/testHelpers/setup";
import type { CmsModel } from "~/types";

/**
 * The `/cms/v5/*` endpoints serve the v5 schema shape: model field values on the entry root,
 * in the input and in the where input, and sorters without the `values_` prefix.
 */
describe("v5 compatible GraphQL schema", () => {
    const manager = useGraphQLHandler({ path: "manage/en-US" });
    const v5Manage = useGraphQLHandler({ path: "v5/manage/en-US" });
    const v5Read = useGraphQLHandler({ path: "v5/read/en-US" });
    const v6Read = useGraphQLHandler({ path: "read/en-US" });

    let model: CmsModel;

    beforeEach(async () => {
        const { getModel } = await setupGroupAndModels({ manager, models: ["category"] });
        model = getModel("category");
    });

    const createAndPublish = async (title: string, slug: string) => {
        const { singularApiName: name } = model;
        const [create] = await v5Manage.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation Create($data: ${name}Input!) {
                        create${name}(data: $data) {
                            data { id entryId title slug createdBy { id } ownedBy { id } }
                            error { code message }
                        }
                    }
                `,
                variables: { data: { title, slug } }
            }
        });
        expect(create.errors).toBeUndefined();
        expect(create.data[`create${name}`].error).toBeNull();
        const entry = create.data[`create${name}`].data;

        const [publish] = await v5Manage.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation Publish($revision: ID!) {
                        publish${name}(revision: $revision) {
                            data { id publishedOn lastPublishedOn }
                            error { code message }
                        }
                    }
                `,
                variables: { revision: entry.id }
            }
        });
        expect(publish.errors).toBeUndefined();
        expect(publish.data[`publish${name}`].error).toBeNull();

        return { entry, published: publish.data[`publish${name}`].data };
    };

    it("creates, updates and publishes entries with field values on the root", async () => {
        const { singularApiName: name } = model;
        const { entry, published } = await createAndPublish("Fruits", "fruits");

        expect(entry).toMatchObject({
            title: "Fruits",
            slug: "fruits",
            createdBy: { id: expect.any(String) },
            ownedBy: { id: entry.createdBy.id }
        });
        expect(published.publishedOn).toEqual(published.lastPublishedOn);

        const [createFrom] = await v5Manage.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation CreateFrom($revision: ID!) {
                        create${name}From(revision: $revision) {
                            data { id }
                            error { code message }
                        }
                    }
                `,
                variables: { revision: entry.id }
            }
        });
        const revision = createFrom.data[`create${name}From`].data.id;

        const [update] = await v5Manage.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation Update($revision: ID!, $data: ${name}Input!) {
                        update${name}(revision: $revision, data: $data) {
                            data { id title slug }
                            error { code message }
                        }
                    }
                `,
                variables: { revision, data: { title: "Fruits updated" } }
            }
        });
        expect(update.errors).toBeUndefined();
        expect(update.data[`update${name}`]).toEqual({
            data: { id: revision, title: "Fruits updated", slug: "fruits" },
            error: null
        });
    });

    it("lists, filters and sorts on the read API with v5 arguments", async () => {
        const { singularApiName: name, pluralApiName: plural } = model;
        await createAndPublish("Vegetables", "vegetables");
        await createAndPublish("Fruits", "fruits");
        const { entry: animals } = await createAndPublish("Animals", "animals");

        const [list] = await v5Read.invoke({
            body: {
                query: /* GraphQL */ `
                    query List($where: ${name}ListWhereInput, $sort: [${name}ListSorter]) {
                        list${plural}(where: $where, sort: $sort) {
                            data { title slug }
                            error { code message }
                        }
                    }
                `,
                variables: {
                    where: { OR: [{ title_contains: "fruit" }, { slug: "animals" }] },
                    sort: ["title_ASC"]
                }
            }
        });
        expect(list.errors).toBeUndefined();
        expect(list.data[`list${plural}`]).toEqual({
            data: [
                { title: "Animals", slug: "animals" },
                { title: "Fruits", slug: "fruits" }
            ],
            error: null
        });

        const [get] = await v5Read.invoke({
            body: {
                query: /* GraphQL */ `
                    query Get($where: ${name}GetWhereInput!) {
                        get${name}(where: $where) {
                            data { title }
                            error { code message }
                        }
                    }
                `,
                variables: { where: { slug: "vegetables" } }
            }
        });
        expect(get.errors).toBeUndefined();
        expect(get.data[`get${name}`]).toEqual({ data: { title: "Vegetables" }, error: null });

        const [getById] = await v5Read.invoke({
            body: {
                query: /* GraphQL */ `
                    query GetById($id: ID!) {
                        get${name}ById(id: $id) {
                            data { id title }
                            error { code message }
                        }
                    }
                `,
                variables: { id: animals.id }
            }
        });
        expect(getById.errors).toBeUndefined();
        expect(getById.data[`get${name}ById`]).toEqual({
            data: { id: animals.id, title: "Animals" },
            error: null
        });
    });

    it("leaves the v6 endpoint shape untouched", async () => {
        const { pluralApiName: plural } = model;
        await createAndPublish("Fruits", "fruits");

        const [list] = await v6Read.invoke({
            body: {
                query: /* GraphQL */ `
                    query {
                        list${plural} {
                            data { values { title } }
                            error { code message }
                        }
                    }
                `
            }
        });
        expect(list.errors).toBeUndefined();
        expect(list.data[`list${plural}`].data).toEqual([{ values: { title: "Fruits" } }]);
    });
});

describe("v5 compatible GraphQL schema, all field types", () => {
    const manager = useGraphQLHandler({ path: "manage/en-US" });

    it("builds the schema for every mock model on all endpoints", async () => {
        await setupGroupAndModels({ manager, models: "*" });

        for (const path of ["v5/manage/en-US", "v5/read/en-US", "v5/preview/en-US"]) {
            const handler = useGraphQLHandler({ path });
            const [response] = await handler.introspect();
            expect(response.errors).toBeUndefined();

            const types = response.data.__schema.types as {
                name: string;
                fields: { name: string }[] | null;
                inputFields: { name: string }[] | null;
            }[];
            const leftovers = types.filter(type => {
                // Content model types (e.g. `CmsPredefinedValues`) had a `values` field in v5 too.
                if (type.name.startsWith("Cms")) {
                    return false;
                }
                if (/^[A-Z]\w*(Input)?Values$/.test(type.name)) {
                    return true;
                }
                const fields = [...(type.fields || []), ...(type.inputFields || [])];
                return fields.some(field => field.name === "values");
            });
            expect(leftovers.map(type => `${path}: ${type.name}`)).toEqual([]);
        }
    });
});

describe("v5 compatible GraphQL schema, ref and object fields", () => {
    const manager = useGraphQLHandler({ path: "manage/en-US" });
    const v5Manage = useGraphQLHandler({ path: "v5/manage/en-US" });
    const v5Read = useGraphQLHandler({ path: "v5/read/en-US" });

    it("writes and filters ref fields, and returns referenced entries in the v5 shape", async () => {
        const { getModel } = await setupGroupAndModels({
            manager,
            models: ["category", "product"]
        });
        const category = getModel("category");
        const product = getModel("product");

        const create = async (model: CmsModel, data: Record<string, any>) => {
            const name = model.singularApiName;
            const [created] = await v5Manage.invoke({
                body: {
                    query: /* GraphQL */ `
                        mutation Create($data: ${name}Input!) {
                            create${name}(data: $data) {
                                data { id entryId }
                                error { code message data }
                            }
                        }
                    `,
                    variables: { data }
                }
            });
            expect(created.errors).toBeUndefined();
            expect(created.data[`create${name}`].error).toBeNull();
            const entry = created.data[`create${name}`].data;
            const [published] = await v5Manage.invoke({
                body: {
                    query: /* GraphQL */ `
                        mutation Publish($revision: ID!) {
                            publish${name}(revision: $revision) { error { message } }
                        }
                    `,
                    variables: { revision: entry.id }
                }
            });
            expect(published.data[`publish${name}`].error).toBeNull();
            return entry;
        };

        const vegetables = await create(category, { title: "Vegetables", slug: "vegetables" });
        const fruits = await create(category, { title: "Fruits", slug: "fruits" });

        const productData = (title: string, price: number, categoryId: string) => ({
            title,
            price,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["m"],
            image: `${title}.jpg`,
            category: { modelId: "category", id: categoryId },
            variant: {
                name: `${title} variant`,
                price: price + 1,
                category: { modelId: "category", id: categoryId }
            }
        });
        await create(product, productData("Potato", 100, vegetables.id));
        await create(product, productData("Carrot", 98, vegetables.id));
        await create(product, productData("Apple", 120, fruits.id));

        const { singularApiName: name, pluralApiName: plural } = product;
        const [list] = await v5Read.invoke({
            body: {
                query: /* GraphQL */ `
                    query List($where: ${name}ListWhereInput, $sort: [${name}ListSorter]) {
                        list${plural}(where: $where, sort: $sort) {
                            data {
                                title
                                price
                                category { title slug }
                                variant { name price category { title } }
                            }
                            error { code message }
                        }
                    }
                `,
                variables: {
                    where: { category: { entryId: vegetables.entryId }, price_gte: 99 },
                    sort: ["price_DESC"]
                }
            }
        });
        expect(list.errors).toBeUndefined();
        expect(list.data[`list${plural}`]).toEqual({
            data: [
                {
                    title: "Potato",
                    price: 100,
                    category: { title: "Vegetables", slug: "vegetables" },
                    variant: {
                        name: "Potato variant",
                        price: 101,
                        category: { title: "Vegetables" }
                    }
                }
            ],
            error: null
        });
    });
});

describe("v5 compatible GraphQL schema, field IDs taken by entry fields", () => {
    const manager = useGraphQLHandler({ path: "manage/en-US" });
    const v5Manage = useGraphQLHandler({ path: "v5/manage/en-US" });

    it("leaves out model fields whose IDs clash with entry fields, instead of breaking the schema", async () => {
        const category = getMockModel("category");
        const title = category.fields.find(field => field.fieldId === "title")!;
        const clashing = ["status", "live", "revisionDescription"].map(fieldId => ({
            ...title,
            id: `${fieldId}Field`,
            fieldId,
            storageId: `text@${fieldId}Field`,
            label: fieldId,
            validation: []
        }));
        const model = {
            ...category,
            modelId: "clash",
            singularApiName: "Clash",
            pluralApiName: "Clashes",
            fields: [{ ...title, validation: [] }, ...clashing],
            layout: [[title.id], ...clashing.map(field => [field.id])]
        };
        await setupGroupAndModels({ manager, models: [model] });

        const [response] = await v5Manage.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation {
                        createClash(data: { title: "First", status: "draft" }) {
                            data {
                                title
                                status
                                live {
                                    version
                                }
                                revisionDescription
                            }
                            error {
                                code
                                message
                            }
                        }
                    }
                `
            }
        });
        expect(response.errors).toBeUndefined();
        expect(response.data.createClash).toEqual({
            data: { title: "First", status: "draft", live: null, revisionDescription: "" },
            error: null
        });
    });
});
