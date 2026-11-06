import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CmsTestPermissions, identityA, identityB } from "../utils";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types";
import { createDecorator, Result } from "@webiny/feature/api";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntry/GetEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import {
    GetLatestDeletedRevisionByEntryIdUseCase,
    GetLatestRevisionByEntryIdIncludingDeletedUseCase,
    GetLatestRevisionByEntryIdUseCase
} from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetPreviousRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPreviousRevisionByEntryId/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntry/GetLatestEntriesByIds/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/GetSingletonEntry/index.js";

/**
 * Makes every GetEntryById read fail with a storage error.
 */
class FailingGetEntryById implements GetEntryByIdUseCase.Interface {
    public constructor(_decoratee: GetEntryByIdUseCase.Interface) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, GetEntryByIdUseCase.Error>> {
        return Result.fail(
            new EntryPersistenceError(new Error(`Could not read "${model.modelId}" entry "${id}".`))
        );
    }
}

const FailingGetEntryByIdDecorator = createDecorator({
    abstraction: GetEntryByIdUseCase,
    decorator: FailingGetEntryById,
    dependencies: []
});

const GET_TEST_ENTRY_REVISIONS = /* GraphQL */ `
    query GetTestEntryRevisions($id: ID!) {
        getTestEntryRevisions(id: $id) {
            data {
                id
                entryId
            }
            error {
                code
                message
            }
        }
    }
`;

const createOwnEntriesPermissions = () => {
    return new CmsTestPermissions({
        groups: { rwd: "rwd" },
        models: { rwd: "rwd" },
        entries: { rwd: "rwd", own: true, pw: "pu" }
    }).getPermissions();
};

type ManageApi = ReturnType<typeof useTestModelHandler>["manage"];

interface TestEntries {
    /** First revision, published. */
    published: CmsEntry;
    /** Second revision, draft (latest). */
    latest: CmsEntry;
}

interface IdentityScope {
    manageApi: ManageApi;
    container: Container;
    model: CmsModel;
}

/**
 * Runs a request so the handler captures the request container of its identity, then reads the
 * test model in it.
 */
const createScope = async (manageApi: ManageApi): Promise<IdentityScope> => {
    await manageApi.listTestEntries();
    const container: Container = manageApi.getContext().container;
    const modelResult = await container.resolve(IdentityContext).withoutAuthorization(() => {
        return container.resolve(GetModelUseCase).execute("testModel");
    });
    if (modelResult.isFail()) {
        throw modelResult.error;
    }
    return { manageApi, container, model: modelResult.value };
};

/**
 * Creates an entry with two revisions as the scope's identity; the first one is published.
 */
const createEntries = async (scope: IdentityScope, title: string): Promise<TestEntries> => {
    const { container, model } = scope;
    const created = await container
        .resolve(CreateEntryUseCase)
        .execute(model, { values: { title, slug: title } });
    if (created.isFail()) {
        throw created.error;
    }
    const published = await container.resolve(PublishEntryUseCase).execute(model, created.value.id);
    if (published.isFail()) {
        throw published.error;
    }
    const latest = await container
        .resolve(CreateEntryRevisionFromUseCase)
        .execute(model, published.value.id, { values: { title, slug: title } });
    if (latest.isFail()) {
        throw latest.error;
    }
    return { published: published.value, latest: latest.value };
};

const setup = async () => {
    const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
    await manageApiA.setup();

    const { manage: manageApiB } = useTestModelHandler({
        identity: identityB,
        permissions: createOwnEntriesPermissions()
    });

    const scopeA = await createScope(manageApiA);
    const scopeB = await createScope(manageApiB);

    const entryA = await createEntries(scopeA, "entry-of-a");
    const entryB = await createEntries(scopeB, "entry-of-b");

    expect(entryA.published.createdBy.id).toBe("a");
    expect(entryB.published.createdBy.id).toBe("b");

    return { scopeA, scopeB, entryA, entryB };
};

describe("Own Entries Permissions Checks", () => {
    it("should not allow reading entries of other users via GraphQL", async () => {
        const { scopeB, entryA } = await setup();
        const manageApiB = scopeB.manageApi;

        // By revision (GetEntryById).
        const byRevision = await manageApiB.getTestEntry({
            variables: { revision: entryA.published.id }
        });
        expect(byRevision.data).toBeNull();
        expect(byRevision.error).toMatchObject({ code: "Cms/Entry/NotFound" });

        // Latest revision by entryId (GetLatestEntriesByIds).
        const latest = await manageApiB.getTestEntry({
            variables: { entryId: entryA.published.entryId }
        });
        expect(latest).toEqual({ data: null, error: null });

        // Published revision by entryId (GetPublishedEntriesByIds).
        const published = await manageApiB.getTestEntry({
            variables: { entryId: entryA.published.entryId, status: "published" }
        });
        expect(published).toEqual({ data: null, error: null });

        // By ids (GetEntriesByIds).
        const [byIds] = await manageApiB.getTestEntriesByIds({
            variables: { revisions: [entryA.published.id, entryA.latest.id] }
        });
        expect(byIds.data.getTestEntriesByIds).toEqual({ data: [], error: null });

        // Revisions (GetRevisionsByEntryId).
        const [revisions] = await manageApiB.invoke({
            body: {
                query: GET_TEST_ENTRY_REVISIONS,
                variables: { id: entryA.published.entryId }
            }
        });
        expect(revisions.data.getTestEntryRevisions).toEqual({ data: [], error: null });

        // List (already filtered by createdBy, must stay that way).
        const list = await manageApiB.listTestEntries();
        expect(list.data.map(item => item.createdBy.id)).toEqual(["b"]);
    });

    it("should allow reading own entries via GraphQL", async () => {
        const { scopeB, entryA, entryB } = await setup();
        const manageApiB = scopeB.manageApi;

        const byRevision = await manageApiB.getTestEntry({
            variables: { revision: entryB.published.id }
        });
        expect(byRevision).toMatchObject({ data: { id: entryB.published.id }, error: null });

        const latest = await manageApiB.getTestEntry({
            variables: { entryId: entryB.published.entryId }
        });
        expect(latest).toMatchObject({ data: { id: entryB.latest.id }, error: null });

        const published = await manageApiB.getTestEntry({
            variables: { entryId: entryB.published.entryId, status: "published" }
        });
        expect(published).toMatchObject({ data: { id: entryB.published.id }, error: null });

        // Mixed ids: only own entries are returned.
        const [byIds] = await manageApiB.getTestEntriesByIds({
            variables: {
                revisions: [entryA.published.id, entryB.published.id, entryB.latest.id]
            }
        });
        expect(byIds.data.getTestEntriesByIds.error).toBeNull();
        expect(
            byIds.data.getTestEntriesByIds.data.map((item: { id: string }) => item.id).sort()
        ).toEqual([entryB.published.id, entryB.latest.id].sort());

        const [revisions] = await manageApiB.invoke({
            body: {
                query: GET_TEST_ENTRY_REVISIONS,
                variables: { id: entryB.published.entryId }
            }
        });
        expect(revisions.data.getTestEntryRevisions.error).toBeNull();
        expect(
            revisions.data.getTestEntryRevisions.data.map((item: { id: string }) => item.id)
        ).toEqual([entryB.latest.id, entryB.published.id]);
    });

    it("should not allow reading single entries of other users via use cases", async () => {
        const { scopeB, entryA } = await setup();
        const { container, model } = scopeB;

        const revision = await container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entryA.published.id);
        expect(revision.isFail()).toBe(true);
        expect(revision.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const published = await container
            .resolve(GetPublishedRevisionByEntryIdUseCase)
            .execute(model, entryA.published.entryId);
        expect(published.isFail()).toBe(true);
        expect(published.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const latest = await container
            .resolve(GetLatestRevisionByEntryIdUseCase)
            .execute(model, { id: entryA.published.entryId });
        expect(latest.isFail()).toBe(true);
        expect(latest.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const latestIncludingDeleted = await container
            .resolve(GetLatestRevisionByEntryIdIncludingDeletedUseCase)
            .execute(model, { id: entryA.published.entryId });
        expect(latestIncludingDeleted.isFail()).toBe(true);
        expect(latestIncludingDeleted.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const latestDeleted = await container
            .resolve(GetLatestDeletedRevisionByEntryIdUseCase)
            .execute(model, { id: entryA.published.entryId });
        expect(latestDeleted.isFail()).toBe(true);
        expect(latestDeleted.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const previous = await container
            .resolve(GetPreviousRevisionByEntryIdUseCase)
            .execute(model, { entryId: entryA.published.entryId, version: 2 });
        expect(previous.isFail()).toBe(true);
        expect(previous.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const entryById = await container
            .resolve(GetEntryByIdUseCase)
            .execute(model, entryA.published.id);
        expect(entryById.isFail()).toBe(true);
        expect(entryById.error).toMatchObject({ code: "Cms/Entry/NotFound" });
    });

    it("should drop entries of other users from list use cases", async () => {
        const { scopeB, entryA, entryB } = await setup();
        const { container, model } = scopeB;

        const byIds = await container
            .resolve(GetEntriesByIdsUseCase)
            .execute(model, [entryA.published.id, entryA.latest.id, entryB.published.id]);
        expect(byIds.isOk()).toBe(true);
        expect(byIds.value.map(item => item.id)).toEqual([entryB.published.id]);

        const latestByIds = await container
            .resolve(GetLatestEntriesByIdsUseCase)
            .execute(model, [entryA.published.entryId, entryB.published.entryId]);
        expect(latestByIds.isOk()).toBe(true);
        expect(latestByIds.value.map(item => item.id)).toEqual([entryB.latest.id]);

        const publishedByIds = await container
            .resolve(GetPublishedEntriesByIdsUseCase)
            .execute(model, [entryA.published.entryId, entryB.published.entryId]);
        expect(publishedByIds.isOk()).toBe(true);
        expect(publishedByIds.value.map(item => item.id)).toEqual([entryB.published.id]);

        const revisionsA = await container
            .resolve(GetRevisionsByEntryIdUseCase)
            .execute(model, entryA.published.entryId);
        expect(revisionsA.isOk()).toBe(true);
        expect(revisionsA.value).toEqual([]);
    });

    it("should allow reading own entries via use cases", async () => {
        const { scopeB, entryB } = await setup();
        const { container, model } = scopeB;

        const revision = await container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entryB.published.id);
        expect(revision.isOk()).toBe(true);
        expect(revision.value.id).toBe(entryB.published.id);

        const published = await container
            .resolve(GetPublishedRevisionByEntryIdUseCase)
            .execute(model, entryB.published.entryId);
        expect(published.isOk()).toBe(true);
        expect(published.value?.id).toBe(entryB.published.id);

        const latest = await container
            .resolve(GetLatestRevisionByEntryIdUseCase)
            .execute(model, { id: entryB.published.entryId });
        expect(latest.isOk()).toBe(true);
        expect(latest.value.id).toBe(entryB.latest.id);

        const previous = await container
            .resolve(GetPreviousRevisionByEntryIdUseCase)
            .execute(model, { entryId: entryB.published.entryId, version: 2 });
        expect(previous.isOk()).toBe(true);
        expect(previous.value.id).toBe(entryB.published.id);

        const entryById = await container
            .resolve(GetEntryByIdUseCase)
            .execute(model, entryB.published.id);
        expect(entryById.isOk()).toBe(true);
        expect(entryById.value.id).toBe(entryB.published.id);

        const revisions = await container
            .resolve(GetRevisionsByEntryIdUseCase)
            .execute(model, entryB.published.entryId);
        expect(revisions.isOk()).toBe(true);
        expect(revisions.value.map(item => item.id).sort()).toEqual(
            [entryB.published.id, entryB.latest.id].sort()
        );
    });

    it("should return entries of other users to internal callers running without authorization", async () => {
        const { scopeB, entryA } = await setup();
        const { container, model } = scopeB;

        const revision = await container.resolve(IdentityContext).withoutAuthorization(() => {
            return container.resolve(GetRevisionByIdUseCase).execute(model, entryA.latest.id);
        });
        expect(revision.isOk()).toBe(true);
        expect(revision.value.id).toBe(entryA.latest.id);

        const latestByIds = await container.resolve(IdentityContext).withoutAuthorization(() => {
            return container
                .resolve(GetLatestEntriesByIdsUseCase)
                .execute(model, [entryA.published.entryId]);
        });
        expect(latestByIds.isOk()).toBe(true);
        expect(latestByIds.value.map(item => item.id)).toEqual([entryA.latest.id]);
    });

    it("should not resolve references to entries of other users", async () => {
        /**
         * Reference fields are resolved via GetLatestEntriesByIds (manage) and
         * GetPublishedEntriesByIds (read), so a reference to another user's entry
         * resolves to nothing.
         */
        const { scopeB, entryA } = await setup();
        const { container, model } = scopeB;

        const latest = await container
            .resolve(GetLatestEntriesByIdsUseCase)
            .execute(model, [entryA.published.entryId]);
        expect(latest.isOk()).toBe(true);
        expect(latest.value).toEqual([]);

        const published = await container
            .resolve(GetPublishedEntriesByIdsUseCase)
            .execute(model, [entryA.published.entryId]);
        expect(published.isOk()).toBe(true);
        expect(published.value).toEqual([]);
    });
});

describe("Own Entries Permissions Checks - singleton model", () => {
    const plugins = createPluginFromCmsModel({
        ...getCmsModel("categorySingleton"),
        tags: [CMS_MODEL_SINGLETON_TAG]
    });

    it("should allow own-scope users to read and update a singleton entry created by another user", async () => {
        const managerA = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins,
            identity: identityA
        });
        const managerB = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins,
            identity: identityB,
            permissions: createOwnEntriesPermissions()
        });

        // A creates the singleton entry.
        const [responseA] = await managerA.getCategory();
        expect(responseA.data.getCategory.error).toBeNull();
        const singleton = responseA.data.getCategory.data;
        expect(singleton.createdBy.id).toBe("a");

        // B reads the same entry; it is not re-created.
        const [responseB] = await managerB.getCategory();
        expect(responseB.data.getCategory).toMatchObject({
            data: { id: singleton.id, createdBy: { id: "a" } },
            error: null
        });

        // B can update it.
        const [updateB] = await managerB.updateCategory({
            data: { values: { title: "Updated by B", slug: "updated-by-b" } }
        });
        expect(updateB.data.updateCategory).toMatchObject({
            data: {
                id: singleton.id,
                createdBy: { id: "a" },
                values: { title: "Updated by B", slug: "updated-by-b" }
            },
            error: null
        });

        // A still sees B's update: the entry was not overwritten with empty data.
        const [responseA2] = await managerA.getCategory();
        expect(responseA2.data.getCategory).toMatchObject({
            data: {
                id: singleton.id,
                values: { title: "Updated by B", slug: "updated-by-b" }
            },
            error: null
        });
    });

    it("should propagate errors other than not found instead of creating the singleton entry", async () => {
        const managerA = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins,
            identity: identityA
        });
        const [created] = await managerA.getCategory();
        expect(created.data.getCategory.error).toBeNull();
        const singleton = created.data.getCategory.data;

        const [updated] = await managerA.updateCategory({
            data: { values: { title: "Keep me", slug: "keep-me" } }
        });
        expect(updated.data.updateCategory.error).toBeNull();

        // The singleton read fails with a storage error.
        const failingManager = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins,
            identity: identityA,
            afterSetup: container => {
                container.registerDecorator(FailingGetEntryByIdDecorator);
            }
        });
        const [failed] = await failingManager.getCategory();
        expect(failed.data.getCategory).toMatchObject({
            data: null,
            error: { code: "Cms/Entry/PersistenceError" }
        });

        const container: Container = failingManager.getContext().container;
        const modelResult = await container.resolve(GetModelUseCase).execute("categorySingleton");
        expect(modelResult.isOk()).toBe(true);
        const result = await container.resolve(GetSingletonEntryUseCase).execute(modelResult.value);
        expect(result.isFail()).toBe(true);
        expect(result.error).toMatchObject({ code: "Cms/Entry/PersistenceError" });

        // The existing entry was not overwritten with empty data.
        const [stillThere] = await managerA.getCategory();
        expect(stillThere.data.getCategory).toMatchObject({
            data: { id: singleton.id, values: { title: "Keep me", slug: "keep-me" } },
            error: null
        });
    });
});
