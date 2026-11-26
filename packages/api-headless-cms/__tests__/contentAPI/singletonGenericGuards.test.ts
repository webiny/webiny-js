import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CmsTestPermissions, identityA, identityB } from "./security/utils";
import { CMS_MODEL_PUBLISHING_ENABLED_TAG, CMS_MODEL_SINGLETON_TAG } from "~/constants";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId";
import { EntryLockedError } from "~/domain/contentEntry/errors";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { EntryAfterPublishEventHandler } from "~/features/contentEntry/PublishEntry/index.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { DeleteMultipleEntriesUseCase } from "~/features/contentEntry/DeleteMultipleEntries/index.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateRevisionDescription/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";

const NO_PUBLISHING = "Model does not support publishing.";
const FIRST_REVISION = "The first revision of a singleton entry cannot be deleted.";
const PUBLISHED_REVISION = "The published revision cannot be deleted. Unpublish it first.";
const NO_DELETE = "Singleton entry cannot be deleted.";

const baseModel = getCmsModel("categorySingleton");

const untaggedPlugins = createPluginFromCmsModel({
    ...baseModel,
    tags: [CMS_MODEL_SINGLETON_TAG]
});

const taggedPlugins = createPluginFromCmsModel({
    ...baseModel,
    tags: [CMS_MODEL_SINGLETON_TAG, CMS_MODEL_PUBLISHING_ENABLED_TAG]
});

const values = { title: "Title", slug: "slug" };

const createOwnEntriesPermissions = () => {
    return new CmsTestPermissions({
        groups: { rwd: "rwd" },
        models: { rwd: "rwd" },
        entries: { rwd: "rwd", own: true, pw: "pu" }
    }).getPermissions();
};

describe("singleton generic guards - untagged model", () => {
    // Seeding goes through a tagged handler, because an untagged model cannot create revisions.
    // The assertions run through the untagged handler on the same storage, like a model whose
    // tag was removed.
    const tagged = useSingletonCategoryHandler({ path: "manage/en-US", plugins: taggedPlugins });
    const manager = useSingletonCategoryHandler({
        path: "manage/en-US",
        plugins: untaggedPlugins
    });

    it("should reject publish, unpublish and create revision from", async () => {
        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const createResult = await container
            .resolve(CreateEntryUseCase)
            .execute(
                model,
                { id: createSingletonEntryId(model), values },
                { skipValidation: true }
            );
        expect(createResult.isOk()).toBe(true);
        const entry = createResult.value;

        const publishResult = await container.resolve(PublishEntryUseCase).execute(model, entry.id);
        expect(publishResult.isFail()).toBe(true);
        expect(publishResult.error.message).toBe(NO_PUBLISHING);

        const unpublishResult = await container
            .resolve(UnpublishEntryUseCase)
            .execute(model, entry.id);
        expect(unpublishResult.isFail()).toBe(true);
        expect(unpublishResult.error.message).toBe(NO_PUBLISHING);

        const revisionResult = await container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, entry.id, {});
        expect(revisionResult.isFail()).toBe(true);
        expect(revisionResult.error.message).toBe(NO_PUBLISHING);
    });

    it("should reject deleting any revision", async () => {
        await tagged.introspect();
        const taggedContainer = tagged.getContext().container;
        const taggedModel = (
            await taggedContainer.resolve(GetModelUseCase).execute("categorySingleton")
        ).value;
        const first = (
            await taggedContainer
                .resolve(CreateEntryUseCase)
                .execute(
                    taggedModel,
                    { id: createSingletonEntryId(taggedModel), values },
                    { skipValidation: true }
                )
        ).value;
        const second = (
            await taggedContainer
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(taggedModel, first.id, {})
        ).value;

        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const result = await container
            .resolve(DeleteEntryRevisionUseCase)
            .execute(model, second.id);
        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe(NO_PUBLISHING);
    });

    it("should skip the lock check for a locked #0001", async () => {
        await tagged.introspect();
        const taggedContainer = tagged.getContext().container;
        const taggedModel = (
            await taggedContainer.resolve(GetModelUseCase).execute("categorySingleton")
        ).value;
        const first = (
            await taggedContainer
                .resolve(CreateEntryUseCase)
                .execute(
                    taggedModel,
                    { id: createSingletonEntryId(taggedModel), values },
                    { skipValidation: true }
                )
        ).value;
        const published = await taggedContainer
            .resolve(PublishEntryUseCase)
            .execute(taggedModel, first.id);
        expect(published.isOk()).toBe(true);

        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const result = await container
            .resolve(UpdateEntryUseCase)
            .execute(model, first.id, { values: { title: "Edited", slug: "edited" } });
        expect(result.isOk()).toBe(true);
        expect(result.value.values.title).toBe("Edited");
    });

    it("should keep the lock check for a locked leftover #0002", async () => {
        await tagged.introspect();
        const taggedContainer = tagged.getContext().container;
        const taggedModel = (
            await taggedContainer.resolve(GetModelUseCase).execute("categorySingleton")
        ).value;
        const first = (
            await taggedContainer
                .resolve(CreateEntryUseCase)
                .execute(
                    taggedModel,
                    { id: createSingletonEntryId(taggedModel), values },
                    { skipValidation: true }
                )
        ).value;
        const second = (
            await taggedContainer
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(taggedModel, first.id, {})
        ).value;
        const published = await taggedContainer
            .resolve(PublishEntryUseCase)
            .execute(taggedModel, second.id);
        expect(published.isOk()).toBe(true);

        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const result = await container
            .resolve(UpdateEntryUseCase)
            .execute(model, second.id, { values: { title: "Edited", slug: "edited" } });
        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(EntryLockedError);
    });

    it("should reject DeleteEntry and DeleteMultipleEntries", async () => {
        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;
        const entryId = createSingletonEntryId(model);

        const deleteResult = await container
            .resolve(DeleteEntryUseCase)
            .execute(model, entryId, {});
        expect(deleteResult.isFail()).toBe(true);
        expect(deleteResult.error.message).toBe(NO_DELETE);

        const deleteMultipleResult = await container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [entryId] });
        expect(deleteMultipleResult.isFail()).toBe(true);
        expect(deleteMultipleResult.error.message).toBe(NO_DELETE);
    });
});

describe("singleton generic guards - tagged model", () => {
    const manager = useSingletonCategoryHandler({
        path: "manage/en-US",
        plugins: taggedPlugins
    });

    it("should apply the delete revision rules", async () => {
        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;
        const createRevisionFrom = container.resolve(CreateEntryRevisionFromUseCase);
        const publishEntry = container.resolve(PublishEntryUseCase);
        const deleteRevision = container.resolve(DeleteEntryRevisionUseCase);

        const first = (
            await container
                .resolve(CreateEntryUseCase)
                .execute(
                    model,
                    { id: createSingletonEntryId(model), values },
                    { skipValidation: true }
                )
        ).value;
        const second = (await createRevisionFrom.execute(model, first.id, {})).value;
        const third = (await createRevisionFrom.execute(model, second.id, {})).value;

        // #0001 fails with the first revision message.
        const firstResult = await deleteRevision.execute(model, first.id);
        expect(firstResult.isFail()).toBe(true);
        expect(firstResult.error.message).toBe(FIRST_REVISION);

        // Also when #0001 is published.
        const publishFirst = await publishEntry.execute(model, first.id);
        expect(publishFirst.isOk()).toBe(true);
        const publishedFirstResult = await deleteRevision.execute(model, first.id);
        expect(publishedFirstResult.isFail()).toBe(true);
        expect(publishedFirstResult.error.message).toBe(FIRST_REVISION);

        // The published #0002 fails with the published message.
        const publishSecond = await publishEntry.execute(model, second.id);
        expect(publishSecond.isOk()).toBe(true);
        const publishedSecondResult = await deleteRevision.execute(model, second.id);
        expect(publishedSecondResult.isFail()).toBe(true);
        expect(publishedSecondResult.error.message).toBe(PUBLISHED_REVISION);

        // An unpublished #0003 is deleted.
        const thirdResult = await deleteRevision.execute(model, third.id);
        expect(thirdResult.isOk()).toBe(true);
    });

    it("should keep the lock check on a locked revision", async () => {
        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const first = (
            await container
                .resolve(CreateEntryUseCase)
                .execute(
                    model,
                    { id: createSingletonEntryId(model), values },
                    { skipValidation: true }
                )
        ).value;
        const published = await container.resolve(PublishEntryUseCase).execute(model, first.id);
        expect(published.isOk()).toBe(true);

        const result = await container
            .resolve(UpdateEntryUseCase)
            .execute(model, first.id, { values: { title: "Edited", slug: "edited" } });
        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(EntryLockedError);
    });

    it("should reject DeleteEntry and DeleteMultipleEntries", async () => {
        await manager.introspect();
        const container = manager.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;
        const entryId = createSingletonEntryId(model);

        const deleteResult = await container
            .resolve(DeleteEntryUseCase)
            .execute(model, entryId, {});
        expect(deleteResult.isFail()).toBe(true);
        expect(deleteResult.error.message).toBe(NO_DELETE);

        const deleteMultipleResult = await container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [entryId] });
        expect(deleteMultipleResult.isFail()).toBe(true);
        expect(deleteMultipleResult.error.message).toBe(NO_DELETE);
    });

    it("should let an own-entries user manage a singleton created by another identity", async () => {
        const managerA = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins: taggedPlugins,
            identity: identityA
        });
        const managerB = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins: taggedPlugins,
            identity: identityB,
            permissions: createOwnEntriesPermissions()
        });

        await managerA.introspect();
        const containerA = managerA.getContext().container;
        const modelA = (await containerA.resolve(GetModelUseCase).execute("categorySingleton"))
            .value;
        const first = (
            await containerA
                .resolve(CreateEntryUseCase)
                .execute(
                    modelA,
                    { id: createSingletonEntryId(modelA), values },
                    { skipValidation: true }
                )
        ).value;
        expect(first.createdBy.id).toBe("a");
        const second = (
            await containerA.resolve(CreateEntryRevisionFromUseCase).execute(modelA, first.id, {})
        ).value;

        await managerB.introspect();
        const container = managerB.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const published = await container.resolve(PublishEntryUseCase).execute(model, first.id);
        expect(published.isOk()).toBe(true);

        const unpublished = await container.resolve(UnpublishEntryUseCase).execute(model, first.id);
        expect(unpublished.isOk()).toBe(true);

        const created = await container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, second.id, {});
        expect(created.isOk()).toBe(true);

        const deleted = await container
            .resolve(DeleteEntryRevisionUseCase)
            .execute(model, created.value.id);
        expect(deleted.isOk()).toBe(true);
    });

    it("should let an own-entries user update the revision description of a singleton created by another identity", async () => {
        const managerA = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins: taggedPlugins,
            identity: identityA
        });
        const managerB = useSingletonCategoryHandler({
            path: "manage/en-US",
            plugins: taggedPlugins,
            identity: identityB,
            permissions: createOwnEntriesPermissions()
        });

        await managerA.introspect();
        const modelA = (
            await managerA
                .getContext()
                .container.resolve(GetModelUseCase)
                .execute("categorySingleton")
        ).value;
        const first = (
            await managerA
                .getContext()
                .container.resolve(CreateEntryUseCase)
                .execute(
                    modelA,
                    { id: createSingletonEntryId(modelA), values },
                    { skipValidation: true }
                )
        ).value;
        expect(first.createdBy.id).toBe("a");

        await managerB.introspect();
        const container = managerB.getContext().container;
        const model = (await container.resolve(GetModelUseCase).execute("categorySingleton")).value;

        const result = await container
            .resolve(UpdateRevisionDescriptionUseCase)
            .execute(model, first.id, "A description");
        expect(result.isOk()).toBe(true);
        expect(result.value.revisionDescription).toBe("A description");
    });
});

describe("singleton generic guards - events", () => {
    it("should fire EntryAfterPublishEventHandler for a tagged singleton", async () => {
        const published: string[] = [];
        const { handler, tenant } = useHandler({
            plugins: [
                taggedPlugins,
                container => {
                    container.registerFactory(EntryAfterPublishEventHandler, () => ({
                        async handle(event) {
                            published.push(event.payload.entry.id);
                        }
                    }));
                }
            ]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });
        const model = (
            await context.container.resolve(GetModelUseCase).execute("categorySingleton")
        ).value;

        const entry = (
            await context.container
                .resolve(CreateEntryUseCase)
                .execute(
                    model,
                    { id: createSingletonEntryId(model), values },
                    { skipValidation: true }
                )
        ).value;
        const result = await context.container
            .resolve(PublishEntryUseCase)
            .execute(model, entry.id);

        expect(result.isOk()).toBe(true);
        expect(published).toEqual([entry.id]);
    });
});
