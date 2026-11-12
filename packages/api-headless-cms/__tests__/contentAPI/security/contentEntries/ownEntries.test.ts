import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CmsTestPermissions, identityA, identityB } from "../utils";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";
import type { CmsContext, CmsModel } from "~/types";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetPreviousRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPreviousRevisionByEntryId/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntry/GetLatestEntriesByIds/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

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

describe("Own Entries Permissions Checks", () => {
    const setup = async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: createOwnEntriesPermissions()
        });

        // Entry A has two revisions, the first one is published.
        const entryA = await manageApiA.createTestEntry();
        expect(entryA.error).toBeNull();
        const publishedA = await manageApiA.publishTestEntry({
            variables: { revision: entryA.data.id }
        });
        expect(publishedA.error).toBeNull();
        const entryARev2 = await manageApiA.createTestEntryFrom({
            variables: { revision: entryA.data.id }
        });
        expect(entryARev2.error).toBeNull();

        // Entry B has two revisions, the first one is published.
        const entryB = await manageApiB.createTestEntry();
        expect(entryB.error).toBeNull();
        const publishedB = await manageApiB.publishTestEntry({
            variables: { revision: entryB.data.id }
        });
        expect(publishedB.error).toBeNull();
        const entryBRev2 = await manageApiB.createTestEntryFrom({
            variables: { revision: entryB.data.id }
        });
        expect(entryBRev2.error).toBeNull();

        return {
            manageApiA,
            manageApiB,
            entryA: entryA.data,
            entryARev2: entryARev2.data,
            entryB: entryB.data,
            entryBRev2: entryBRev2.data
        };
    };

    const getContextAndModel = async (
        manageApi: ReturnType<typeof useTestModelHandler>["manage"]
    ): Promise<{ context: CmsContext; model: CmsModel }> => {
        // Run any request so the handler captures the context of the identity.
        await manageApi.listTestEntries();
        const context = manageApi.getContext();
        const model = await context.security.withoutAuthorization(() => {
            return context.cms.getModel("testModel");
        });
        return { context, model };
    };

    it("should not allow reading entries of other users via GraphQL", async () => {
        const { manageApiB, entryA, entryARev2 } = await setup();

        // getEntryById (by revision).
        const byRevision = await manageApiB.getTestEntry({
            variables: { revision: entryA.id }
        });
        expect(byRevision.data).toBeNull();
        expect(byRevision.error).toMatchObject({ code: "Cms/Entry/NotFound" });

        // Latest revision (by entryId).
        const latest = await manageApiB.getTestEntry({
            variables: { entryId: entryA.entryId }
        });
        expect(latest).toEqual({ data: null, error: null });

        // Published revision (by entryId and status).
        const published = await manageApiB.getTestEntry({
            variables: { entryId: entryA.entryId, status: "published" }
        });
        expect(published).toEqual({ data: null, error: null });

        // getEntriesByIds.
        const [byIds] = await manageApiB.getTestEntriesByIds({
            variables: { revisions: [entryA.id, entryARev2.id] }
        });
        expect(byIds.data.getTestEntriesByIds).toEqual({ data: [], error: null });

        // Revisions.
        const [revisions] = await manageApiB.invoke({
            body: { query: GET_TEST_ENTRY_REVISIONS, variables: { id: entryA.entryId } }
        });
        expect(revisions.data.getTestEntryRevisions).toEqual({ data: [], error: null });

        // List (already filtered by createdBy, must stay that way).
        const list = await manageApiB.listTestEntries();
        expect(list.data.map(item => item.createdBy.id)).toEqual(["b"]);
    });

    it("should allow reading own entries via GraphQL", async () => {
        const { manageApiB, entryA, entryB, entryBRev2 } = await setup();

        const byRevision = await manageApiB.getTestEntry({
            variables: { revision: entryB.id }
        });
        expect(byRevision).toMatchObject({ data: { id: entryB.id }, error: null });

        const latest = await manageApiB.getTestEntry({
            variables: { entryId: entryB.entryId }
        });
        expect(latest).toMatchObject({ data: { id: entryBRev2.id }, error: null });

        const published = await manageApiB.getTestEntry({
            variables: { entryId: entryB.entryId, status: "published" }
        });
        expect(published).toMatchObject({ data: { id: entryB.id }, error: null });

        // Mixed ids: only own entries are returned.
        const [byIds] = await manageApiB.getTestEntriesByIds({
            variables: { revisions: [entryA.id, entryB.id, entryBRev2.id] }
        });
        expect(byIds.data.getTestEntriesByIds.error).toBeNull();
        expect(
            byIds.data.getTestEntriesByIds.data.map((item: { id: string }) => item.id).sort()
        ).toEqual([entryB.id, entryBRev2.id].sort());

        const [revisions] = await manageApiB.invoke({
            body: { query: GET_TEST_ENTRY_REVISIONS, variables: { id: entryB.entryId } }
        });
        expect(revisions.data.getTestEntryRevisions.error).toBeNull();
        expect(
            revisions.data.getTestEntryRevisions.data.map((item: { id: string }) => item.id)
        ).toEqual([entryBRev2.id, entryB.id]);
    });

    it("should not allow reading entries of other users via use cases", async () => {
        const { manageApiB, entryA, entryARev2, entryB, entryBRev2 } = await setup();
        const { context, model } = await getContextAndModel(manageApiB);

        const getRevisionById = context.container.resolve(GetRevisionByIdUseCase);
        const getPublishedRevision = context.container.resolve(
            GetPublishedRevisionByEntryIdUseCase
        );
        const getLatestRevision = context.container.resolve(GetLatestRevisionByEntryIdUseCase);
        const getPreviousRevision = context.container.resolve(GetPreviousRevisionByEntryIdUseCase);
        const getRevisions = context.container.resolve(GetRevisionsByEntryIdUseCase);

        // Other user's entry.
        const revisionA = await getRevisionById.execute(model, entryA.id);
        expect(revisionA.isFail()).toBe(true);
        expect(revisionA.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const publishedA = await getPublishedRevision.execute(model, entryA.entryId);
        expect(publishedA.isFail()).toBe(true);
        expect(publishedA.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const latestA = await getLatestRevision.execute(model, { id: entryA.entryId });
        expect(latestA.isFail()).toBe(true);
        expect(latestA.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const previousA = await getPreviousRevision.execute(model, {
            entryId: entryA.entryId,
            version: 2
        });
        expect(previousA.isFail()).toBe(true);
        expect(previousA.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const revisionsA = await getRevisions.execute(model, entryA.entryId);
        expect(revisionsA.isOk()).toBe(true);
        expect(revisionsA.value).toEqual([]);

        // Own entry.
        const revisionB = await getRevisionById.execute(model, entryB.id);
        expect(revisionB.isOk()).toBe(true);
        expect(revisionB.value.id).toBe(entryB.id);

        const publishedB = await getPublishedRevision.execute(model, entryB.entryId);
        expect(publishedB.isOk()).toBe(true);
        expect(publishedB.value?.id).toBe(entryB.id);

        const latestB = await getLatestRevision.execute(model, { id: entryB.entryId });
        expect(latestB.isOk()).toBe(true);
        expect(latestB.value.id).toBe(entryBRev2.id);

        const previousB = await getPreviousRevision.execute(model, {
            entryId: entryB.entryId,
            version: 2
        });
        expect(previousB.isOk()).toBe(true);
        expect(previousB.value.id).toBe(entryB.id);

        const revisionsB = await getRevisions.execute(model, entryB.entryId);
        expect(revisionsB.isOk()).toBe(true);
        expect(revisionsB.value.map(item => item.id).sort()).toEqual(
            [entryB.id, entryBRev2.id].sort()
        );

        // Sanity check: the same use cases still return entry A for internal callers.
        const internalRevisionA = await context.security.withoutAuthorization(() => {
            return getRevisionById.execute(model, entryARev2.id);
        });
        expect(internalRevisionA.isOk()).toBe(true);
        expect(internalRevisionA.value.id).toBe(entryARev2.id);
    });

    it("should not allow force deleting entries of other users", async () => {
        const { manageApiA, manageApiB, entryA, entryB } = await setup();
        const { context, model } = await getContextAndModel(manageApiB);
        const deleteEntry = context.container.resolve(DeleteEntryUseCase);

        // Moving to the bin with force must not turn "not authorized" into a raw delete.
        const toBin = await deleteEntry.execute(model, entryA.entryId, {
            force: true,
            permanently: false
        });
        expect(toBin.isFail()).toBe(true);
        expect(toBin.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const permanent = await deleteEntry.execute(model, entryA.entryId, {
            force: true,
            permanently: true
        });
        expect(permanent.isFail()).toBe(true);
        expect(permanent.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        // An own-only user can't prove ownership of leftover records, so no blind cleanup.
        const orphan = await deleteEntry.execute(model, "nonExistingEntryId", {
            force: true,
            permanently: true
        });
        expect(orphan.isFail()).toBe(true);
        expect(orphan.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const stillThere = await manageApiA.getTestEntry({
            variables: { revision: entryA.id }
        });
        expect(stillThere.data?.id).toBe(entryA.id);

        // Own entries can still be force deleted.
        const own = await deleteEntry.execute(model, entryB.entryId, {
            force: true,
            permanently: false
        });
        expect(own.isOk()).toBe(true);
    });

    it("should not allow creating an entry with the id of an existing entry", async () => {
        const { manageApiA, manageApiB, entryA, entryB } = await setup();

        // Another user's entry.
        const takeover = await manageApiB.createTestEntry({
            variables: { data: { id: entryA.entryId, values: { title: "taken", slug: "taken" } } }
        });
        expect(takeover.data).toBeNull();
        expect(takeover.error).toMatchObject({
            code: "Cms/Entry/AlreadyExists"
        });

        // Full access doesn't allow it either.
        const overwrite = await manageApiA.createTestEntry({
            variables: { data: { id: entryB.entryId, values: { title: "taken", slug: "taken" } } }
        });
        expect(overwrite.error).toMatchObject({
            code: "Cms/Entry/AlreadyExists"
        });

        // Entries in the bin count too.
        const { context, model } = await getContextAndModel(manageApiA);
        const deleted = await context.container
            .resolve(DeleteEntryUseCase)
            .execute(model, entryA.entryId, { permanently: false });
        expect(deleted.isOk()).toBe(true);
        const binned = await context.container
            .resolve(CreateEntryUseCase)
            .execute(model, { id: entryA.entryId, values: { title: "taken", slug: "taken" } });
        expect(binned.error).toMatchObject({ code: "Cms/Entry/AlreadyExists" });

        // Untouched.
        const original = await manageApiA.getTestEntry({ variables: { revision: entryB.id } });
        expect(original.data?.values?.title).toBe(entryB.values.title);

        // A new id of the caller's choosing still works.
        const fresh = await manageApiB.createTestEntry({
            variables: {
                data: { id: "my-own-entry-id", values: { title: "fresh", slug: "fresh" } }
            }
        });
        expect(fresh.error).toBeNull();
        expect(fresh.data.entryId).toBe("my-own-entry-id");
    });

    it("should only resolve referenced entries the user can access", async () => {
        /**
         * Reference fields are resolved via GetLatestEntriesByIds (manage) and
         * GetPublishedEntriesByIds (read), so we test those use cases with mixed ids.
         */
        const { manageApiB, entryA, entryB, entryBRev2 } = await setup();
        const { context, model } = await getContextAndModel(manageApiB);

        const getLatestByIds = context.container.resolve(GetLatestEntriesByIdsUseCase);
        const getPublishedByIds = context.container.resolve(GetPublishedEntriesByIdsUseCase);

        const latest = await getLatestByIds.execute(model, [entryA.entryId, entryB.entryId]);
        expect(latest.isOk()).toBe(true);
        expect(latest.value.map(item => item.id)).toEqual([entryBRev2.id]);

        const published = await getPublishedByIds.execute(model, [entryA.entryId, entryB.entryId]);
        expect(published.isOk()).toBe(true);
        expect(published.value.map(item => item.id)).toEqual([entryB.id]);
    });
});

const DELETE_MULTIPLE_TEST_ENTRIES = /* GraphQL */ `
    mutation DeleteMultipleTestEntries($entries: [ID!]!) {
        deleteMultipleTestEntries(entries: $entries) {
            data {
                id
            }
            error {
                code
                message
            }
        }
    }
`;

describe("Own Entries Permissions Checks - read all, delete own", () => {
    // Two roles: one can read all entries, the other can do everything with own entries only.
    const createReadAllDeleteOwnPermissions = () => {
        return [
            ...new CmsTestPermissions({
                groups: { rwd: "r" },
                models: { rwd: "r" },
                entries: { rwd: "r" }
            }).getPermissions(),
            ...new CmsTestPermissions({
                groups: { rwd: "r" },
                models: { rwd: "r" },
                entries: { rwd: "rwd", own: true, pw: "pu" }
            }).getPermissions()
        ];
    };

    it("should delete only own entries via deleteMultiple", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: createReadAllDeleteOwnPermissions()
        });

        const entryA = await manageApiA.createTestEntry();
        expect(entryA.error).toBeNull();
        const entryB = await manageApiB.createTestEntry();
        expect(entryB.error).toBeNull();
        // Published, so the entry has both the latest and the published record in every storage.
        const publishedB = await manageApiB.publishTestEntry({
            variables: { revision: entryB.data.id }
        });
        expect(publishedB.error).toBeNull();

        // B can read A's entry, so it is found, but B must not be able to delete it.
        const [response] = await manageApiB.invoke({
            body: {
                query: DELETE_MULTIPLE_TEST_ENTRIES,
                variables: { entries: [entryA.data.entryId, entryB.data.entryId] }
            }
        });
        expect(response.data.deleteMultipleTestEntries).toEqual({
            data: [{ id: entryB.data.id }],
            error: null
        });

        const stillThere = await manageApiA.getTestEntry({
            variables: { revision: entryA.data.id }
        });
        expect(stillThere.data?.id).toBe(entryA.data.id);

        const deleted = await manageApiA.getTestEntry({
            variables: { revision: entryB.data.id }
        });
        expect(deleted.data).toBeNull();
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

        // B can read it.
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
                values: { title: "Updated by B", slug: "updated-by-b" }
            },
            error: null
        });
    });
});
