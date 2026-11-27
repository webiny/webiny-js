import { describe, expect, it } from "vitest";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CMS_MODEL_PUBLISHING_ENABLED_TAG, CMS_MODEL_SINGLETON_TAG } from "~/constants";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

const FIRST_REVISION = "The first revision of a singleton entry cannot be deleted.";
const LOCKED_CODE = "Cms/Entry/Locked";

const baseModel = getCmsModel("categorySingleton");
const singularName = baseModel.singularApiName;

// The GraphQL schema cache is keyed by the model savedOn, so the untagged model gets a different
// one. Otherwise, a handler switch would reuse the schema built for the other model.
const untaggedPlugins = createPluginFromCmsModel({
    ...baseModel,
    savedOn: "2020-01-01T00:00:00.000Z",
    tags: [CMS_MODEL_SINGLETON_TAG]
});

const taggedPlugins = createPluginFromCmsModel({
    ...baseModel,
    tags: [CMS_MODEL_SINGLETON_TAG, CMS_MODEL_PUBLISHING_ENABLED_TAG]
});

const emptyValues = { title: null, slug: null };
const firstValues = { title: "First title", slug: "first-title" };
const secondValues = { title: "Second title", slug: "second-title" };

const typeFieldsQuery = (name: string) => {
    return /* GraphQL */ `
        query TypeFields {
            __type(name: "${name}") {
                fields {
                    name
                }
            }
        }
    `;
};

const rootFieldsQuery = /* GraphQL */ `
    query RootFields {
        __schema {
            queryType {
                fields {
                    name
                }
            }
            mutationType {
                fields {
                    name
                }
            }
        }
    }
`;

interface NamedField {
    name: string;
}

interface NamedId {
    id: string;
}

const fieldNames = (fields: NamedField[] | null | undefined): string[] => {
    return (fields || []).map(field => field.name);
};

describe("singleton publishing - tagged model", () => {
    const manager = useSingletonCategoryHandler({
        path: "manage/en-US",
        plugins: taggedPlugins
    });
    const reader = useSingletonCategoryHandler({
        path: "read/en-US",
        plugins: taggedPlugins
    });
    const previewer = useSingletonCategoryHandler({
        path: "preview/en-US",
        plugins: taggedPlugins
    });

    const createFirstRevision = async (): Promise<string> => {
        const [latest] = await manager.getCategoryLatest();
        const id: string = latest.data.getCategoryLatest.data.id;
        expect(id).toMatch(/#0001$/);

        const [updated] = await manager.updateCategory(id, { values: firstValues });
        expect(updated.data.updateCategory.error).toBeNull();
        return id;
    };

    it("should return empty values on read until a revision is published", async () => {
        const id = await createFirstRevision();

        const [beforePublish] = await reader.getCategory();
        expect(beforePublish.data.getCategory).toMatchObject({
            data: { id, values: emptyValues },
            error: null
        });

        const [published] = await manager.publishCategory(id);
        expect(published.data.publishCategory).toMatchObject({
            data: { id, meta: { status: "published", locked: true } },
            error: null
        });

        const [afterPublish] = await reader.getCategory();
        expect(afterPublish.data.getCategory).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });
    });

    it("should serve the latest revision on preview and the published one on read", async () => {
        const id = await createFirstRevision();
        await manager.publishCategory(id);

        const [created] = await manager.createCategoryFrom(id);
        expect(created.data.createCategoryFrom.error).toBeNull();
        const secondId: string = created.data.createCategoryFrom.data.id;
        expect(secondId).toMatch(/#0002$/);

        const [updated] = await manager.updateCategory(secondId, { values: secondValues });
        expect(updated.data.updateCategory).toMatchObject({
            data: { id: secondId, values: secondValues },
            error: null
        });

        const [preview] = await previewer.getCategory();
        expect(preview.data.getCategory).toMatchObject({
            data: { id: secondId, values: secondValues },
            error: null
        });

        const [read] = await reader.getCategory();
        expect(read.data.getCategory).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });

        const [revisions] = await manager.getCategoryRevisions(secondId);
        expect(revisions.data.getCategoryRevisions.error).toBeNull();
        expect(revisions.data.getCategoryRevisions.data).toHaveLength(2);
        expect(revisions.data.getCategoryRevisions.data.map((r: NamedId) => r.id)).toEqual([
            secondId,
            id
        ]);
    });

    it("should not update a published revision", async () => {
        const id = await createFirstRevision();
        await manager.publishCategory(id);

        const [response] = await manager.updateCategory(id, { values: secondValues });
        expect(response.data.updateCategory).toMatchObject({
            data: null,
            error: { code: LOCKED_CODE }
        });
    });

    it("should not delete the published first revision", async () => {
        const id = await createFirstRevision();
        await manager.publishCategory(id);

        const [response] = await manager.deleteCategory(id);
        expect(response.data.deleteCategory).toMatchObject({
            data: null,
            error: { message: FIRST_REVISION }
        });
    });

    it("should create the entry on preview when it does not exist", async () => {
        const [preview] = await previewer.getCategory();
        expect(preview.data.getCategory).toMatchObject({
            data: { id: expect.stringMatching(/#0001$/), values: emptyValues },
            error: null
        });

        const [latest] = await manager.getCategoryLatest();
        expect(latest.data.getCategoryLatest.data.id).toBe(preview.data.getCategory.data.id);
    });
});

describe("singleton publishing - tag lifecycle", () => {
    const taggedManager = useSingletonCategoryHandler({
        path: "manage/en-US",
        plugins: taggedPlugins
    });
    const taggedReader = useSingletonCategoryHandler({
        path: "read/en-US",
        plugins: taggedPlugins
    });
    const untaggedManager = useSingletonCategoryHandler({
        path: "manage/en-US",
        plugins: untaggedPlugins
    });
    const untaggedReader = useSingletonCategoryHandler({
        path: "read/en-US",
        plugins: untaggedPlugins
    });
    const untaggedPreviewer = useSingletonCategoryHandler({
        path: "preview/en-US",
        plugins: untaggedPlugins
    });

    it("should keep a published first revision editable after the tag is removed", async () => {
        const [latest] = await taggedManager.getCategoryLatest();
        const id: string = latest.data.getCategoryLatest.data.id;
        await taggedManager.updateCategory(id, { values: firstValues });
        const [published] = await taggedManager.publishCategory(id);
        expect(published.data.publishCategory.error).toBeNull();

        const [updated] = await untaggedManager.updateCategory(id, { values: secondValues });
        expect(updated.data.updateCategory).toMatchObject({
            data: { id, values: secondValues },
            error: null
        });

        const [untaggedRead] = await untaggedReader.getCategory();
        expect(untaggedRead.data.getCategory).toMatchObject({
            data: { id, values: secondValues },
            error: null
        });

        const [taggedRead] = await taggedReader.getCategory();
        expect(taggedRead.data.getCategory).toMatchObject({
            data: { id, values: secondValues },
            error: null
        });
    });

    it("should return the first revision when a later revision is left over", async () => {
        const [latest] = await taggedManager.getCategoryLatest();
        const id: string = latest.data.getCategoryLatest.data.id;
        await taggedManager.updateCategory(id, { values: firstValues });
        const [created] = await taggedManager.createCategoryFrom(id);
        const secondId: string = created.data.createCategoryFrom.data.id;
        expect(secondId).toMatch(/#0002$/);

        const [preview] = await untaggedPreviewer.getCategory();
        expect(preview.data.getCategory).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });

        const [untaggedLatest] = await untaggedManager.getCategoryLatest();
        expect(untaggedLatest.data.getCategoryLatest).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });
    });

    it("should publish an existing first revision after the tag is added", async () => {
        await untaggedManager.introspect();
        const container = untaggedManager.getContext().container;
        const modelResult = await container.resolve(GetModelUseCase).execute(baseModel.modelId);
        const model = modelResult.value;
        const entryId = createSingletonEntryId(model);

        const createResult = await container
            .resolve(CreateEntryUseCase)
            .execute(model, { id: entryId, values: firstValues }, { skipValidation: true });
        expect(createResult.isOk()).toBe(true);
        const id = createResult.value.id;
        expect(id).toBe(`${entryId}#0001`);

        const [latest] = await taggedManager.getCategoryLatest();
        expect(latest.data.getCategoryLatest).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });

        const [published] = await taggedManager.publishCategory(id);
        expect(published.data.publishCategory).toMatchObject({
            data: { id, meta: { status: "published" } },
            error: null
        });

        const [read] = await taggedReader.getCategory();
        expect(read.data.getCategory).toMatchObject({
            data: { id, values: firstValues },
            error: null
        });
    });
});

describe("singleton publishing - schema", () => {
    const reader = useGraphQLHandler({ path: "read/en-US", plugins: taggedPlugins });
    const previewer = useGraphQLHandler({ path: "preview/en-US", plugins: taggedPlugins });

    it.each([
        ["read", reader],
        ["preview", previewer]
    ])("should not expose meta or mutations on %s", async (_, handler) => {
        const [typeResponse] = await handler.invoke({
            body: { query: typeFieldsQuery(singularName) }
        });
        const typeFields = fieldNames(typeResponse.data.__type.fields);
        expect(typeFields).toContain("values");
        expect(typeFields).not.toContain("meta");

        const [rootResponse] = await handler.invoke({ body: { query: rootFieldsQuery } });
        const queryFields = fieldNames(rootResponse.data.__schema.queryType.fields);
        expect(queryFields).toContain(`get${singularName}`);
        expect(queryFields).not.toContain(`get${singularName}Latest`);

        const mutationFields = fieldNames(rootResponse.data.__schema.mutationType?.fields);
        const singletonMutations = mutationFields.filter(name => name.includes(singularName));
        expect(singletonMutations).toEqual([]);
    });

    const emptyModelPlugins = createPluginFromCmsModel({
        ...baseModel,
        modelId: "emptySingleton",
        singularApiName: "EmptySingleton",
        pluralApiName: "EmptySingletons",
        titleFieldId: "id",
        layout: [],
        fields: [],
        tags: [CMS_MODEL_SINGLETON_TAG, CMS_MODEL_PUBLISHING_ENABLED_TAG]
    });
    const emptyManager = useGraphQLHandler({ path: "manage/en-US", plugins: emptyModelPlugins });
    const emptyReader = useGraphQLHandler({ path: "read/en-US", plugins: emptyModelPlugins });
    const emptyPreviewer = useGraphQLHandler({
        path: "preview/en-US",
        plugins: emptyModelPlugins
    });

    it.each([
        ["manage", emptyManager],
        ["read", emptyReader],
        ["preview", emptyPreviewer]
    ])("should not expose a model without fields on %s", async (_, handler) => {
        const [rootResponse] = await handler.invoke({ body: { query: rootFieldsQuery } });
        expect(rootResponse.errors).toBeUndefined();

        const queryFields = fieldNames(rootResponse.data.__schema.queryType.fields);
        const mutationFields = fieldNames(rootResponse.data.__schema.mutationType?.fields);
        const singletonFields = [...queryFields, ...mutationFields].filter(name =>
            name.includes("EmptySingleton")
        );
        expect(singletonFields).toEqual([]);
    });
});
