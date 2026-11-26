import { describe, expect, it } from "vitest";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CMS_MODEL_PUBLISHING_ENABLED_TAG, CMS_MODEL_SINGLETON_TAG } from "~/constants";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId";
import { EntryNotFoundError, EntryLockedError } from "~/domain/contentEntry/errors";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { GetLatestSingletonEntryUseCase } from "~/features/contentEntry/GetLatestSingletonEntry/index.js";
import { GetPublishedSingletonEntryUseCase } from "~/features/contentEntry/GetPublishedSingletonEntry/index.js";
import { GetSingletonEntryRevisionUseCase } from "~/features/contentEntry/GetSingletonEntryRevision/index.js";
import { ListSingletonEntryRevisionsUseCase } from "~/features/contentEntry/ListSingletonEntryRevisions/index.js";
import { UpdateSingletonEntryUseCase } from "~/features/contentEntry/UpdateSingletonEntry/index.js";
import { UpdateSingletonEntryRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateSingletonEntryRevisionDescription/index.js";
import { CreateSingletonEntryRevisionFromUseCase } from "~/features/contentEntry/CreateSingletonEntryRevisionFrom/index.js";
import { PublishSingletonEntryUseCase } from "~/features/contentEntry/PublishSingletonEntry/index.js";
import { UnpublishSingletonEntryUseCase } from "~/features/contentEntry/UnpublishSingletonEntry/index.js";
import { DeleteSingletonEntryRevisionUseCase } from "~/features/contentEntry/DeleteSingletonEntryRevision/index.js";
import type { CmsModel } from "~/types";

const NO_PUBLISHING = "Model does not support publishing.";
const NO_REVISIONS = "Model does not support revisions.";
const REVISION_REQUIRED = "A revision id is required.";
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

interface Setup {
    taggedContainer: ReturnType<
        ReturnType<typeof useSingletonCategoryHandler>["getContext"]
    >["container"];
    taggedModel: CmsModel;
    container: ReturnType<
        ReturnType<typeof useSingletonCategoryHandler>["getContext"]
    >["container"];
    model: CmsModel;
    entryId: string;
}

// Seeding goes through a tagged handler, because an untagged model cannot create revisions.
// The assertions run through the handler of the model under test on the same storage.
const useSetup = (plugins: typeof taggedPlugins) => {
    const tagged = useSingletonCategoryHandler({ path: "manage/en-US", plugins: taggedPlugins });
    const manager = useSingletonCategoryHandler({ path: "manage/en-US", plugins });

    return async (): Promise<Setup> => {
        await tagged.introspect();
        const taggedContainer = tagged.getContext().container;
        const taggedModelResult = await taggedContainer
            .resolve(GetModelUseCase)
            .execute("categorySingleton");
        await manager.introspect();
        const container = manager.getContext().container;
        const modelResult = await container.resolve(GetModelUseCase).execute("categorySingleton");
        return {
            taggedContainer,
            taggedModel: taggedModelResult.value,
            container,
            model: modelResult.value,
            entryId: createSingletonEntryId(modelResult.value)
        };
    };
};

const seed = async (setup: Setup, revisions: number) => {
    const { taggedContainer, taggedModel, entryId } = setup;
    const first = (
        await taggedContainer
            .resolve(CreateEntryUseCase)
            .execute(taggedModel, { id: entryId, values }, { skipValidation: true })
    ).value;
    const created = [first];
    for (let i = 1; i < revisions; i++) {
        const next = await taggedContainer
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(taggedModel, created[i - 1].id, {});
        created.push(next.value);
    }
    return created;
};

describe("singleton use cases - tagged model", () => {
    const setupTagged = useSetup(taggedPlugins);

    it("GetLatestSingletonEntry creates #0001 and then returns the latest revision", async () => {
        const { container, model, entryId } = await setupTagged();
        const useCase = container.resolve(GetLatestSingletonEntryUseCase);

        const created = await useCase.execute(model);
        expect(created.isOk()).toBe(true);
        expect(created.value.id).toBe(`${entryId}#0001`);

        const second = await container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, created.value.id, { values });
        expect(second.isOk()).toBe(true);

        const latest = await useCase.execute(model);
        expect(latest.isOk()).toBe(true);
        expect(latest.value.id).toBe(`${entryId}#0002`);
    });

    it("GetPublishedSingletonEntry returns #0001 with empty values when nothing is published", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [first] = await seed(setup, 1);
        expect(first.values.title).toBe("Title");

        const result = await container.resolve(GetPublishedSingletonEntryUseCase).execute(model);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0001`);
        expect(result.value.values).toEqual({});
    });

    it("GetPublishedSingletonEntry creates the entry when missing", async () => {
        const { container, model, entryId } = await setupTagged();

        const result = await container.resolve(GetPublishedSingletonEntryUseCase).execute(model);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0001`);
        expect(result.value.values).toEqual({});
    });

    it("GetPublishedSingletonEntry returns the published revision", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [first, second] = await seed(setup, 2);
        await container.resolve(PublishEntryUseCase).execute(model, first.id);
        expect(second.id).toBe(`${entryId}#0002`);

        const result = await container.resolve(GetPublishedSingletonEntryUseCase).execute(model);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0001`);
        expect(result.value.values.title).toBe("Title");
    });

    it("GetSingletonEntryRevision returns a revision and rejects foreign and id-only values", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [, second] = await seed(setup, 2);
        const useCase = container.resolve(GetSingletonEntryRevisionUseCase);

        const result = await useCase.execute(model, second.id);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0002`);

        const foreign = await useCase.execute(model, "foreignentry#0001");
        expect(foreign.isFail()).toBe(true);
        expect(foreign.error).toBeInstanceOf(EntryNotFoundError);

        const idOnly = await useCase.execute(model, entryId);
        expect(idOnly.isFail()).toBe(true);
        expect(idOnly.error.message).toBe(REVISION_REQUIRED);
    });

    it("ListSingletonEntryRevisions accepts the entry id and a revision id", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);
        const useCase = container.resolve(ListSingletonEntryRevisionsUseCase);

        const byEntryId = await useCase.execute(model, entryId);
        expect(byEntryId.isOk()).toBe(true);
        expect(byEntryId.value.map(entry => entry.id).sort()).toEqual([
            `${entryId}#0001`,
            `${entryId}#0002`
        ]);

        const byRevisionId = await useCase.execute(model, `${entryId}#0002`);
        expect(byRevisionId.isOk()).toBe(true);
        expect(byRevisionId.value).toHaveLength(2);

        const foreign = await useCase.execute(model, "foreignentry");
        expect(foreign.isFail()).toBe(true);
        expect(foreign.error).toBeInstanceOf(EntryNotFoundError);
    });

    it("UpdateSingletonEntry updates a revision and keeps the lock check", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [first, second] = await seed(setup, 2);
        const useCase = container.resolve(UpdateSingletonEntryUseCase);

        const updated = await useCase.execute(model, second.id, {
            values: { title: "Edited", slug: "edited" }
        });
        expect(updated.isOk()).toBe(true);
        expect(updated.value.values.title).toBe("Edited");

        await container.resolve(PublishEntryUseCase).execute(model, first.id);
        const locked = await useCase.execute(model, first.id, {
            values: { title: "Locked", slug: "locked" }
        });
        expect(locked.isFail()).toBe(true);
        expect(locked.error).toBeInstanceOf(EntryLockedError);

        const idOnly = await useCase.execute(model, entryId, { values });
        expect(idOnly.isFail()).toBe(true);
        expect(idOnly.error.message).toBe(REVISION_REQUIRED);

        const foreign = await useCase.execute(model, "foreignentry#0001", { values });
        expect(foreign.isFail()).toBe(true);
        expect(foreign.error).toBeInstanceOf(EntryNotFoundError);
    });

    it("UpdateSingletonEntryRevisionDescription updates the description", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [first] = await seed(setup, 1);
        const useCase = container.resolve(UpdateSingletonEntryRevisionDescriptionUseCase);

        const result = await useCase.execute(model, first.id, "A description");
        expect(result.isOk()).toBe(true);
        expect(result.value.revisionDescription).toBe("A description");

        const idOnly = await useCase.execute(model, entryId, "Nope");
        expect(idOnly.isFail()).toBe(true);
        expect(idOnly.error.message).toBe(REVISION_REQUIRED);
    });

    it("CreateSingletonEntryRevisionFrom, Publish, Unpublish and Delete work on a tagged model", async () => {
        const setup = await setupTagged();
        const { container, model, entryId } = setup;
        const [first] = await seed(setup, 1);

        const created = await container
            .resolve(CreateSingletonEntryRevisionFromUseCase)
            .execute(model, first.id);
        expect(created.isOk()).toBe(true);
        expect(created.value.id).toBe(`${entryId}#0002`);

        const published = await container
            .resolve(PublishSingletonEntryUseCase)
            .execute(model, created.value.id);
        expect(published.isOk()).toBe(true);

        const deletePublished = await container
            .resolve(DeleteSingletonEntryRevisionUseCase)
            .execute(model, created.value.id);
        expect(deletePublished.isFail()).toBe(true);
        expect(deletePublished.error.message).toBe(
            "The published revision cannot be deleted. Unpublish it first."
        );

        const unpublished = await container
            .resolve(UnpublishSingletonEntryUseCase)
            .execute(model, created.value.id);
        expect(unpublished.isOk()).toBe(true);

        const deleted = await container
            .resolve(DeleteSingletonEntryRevisionUseCase)
            .execute(model, created.value.id);
        expect(deleted.isOk()).toBe(true);

        const deleteFirst = await container
            .resolve(DeleteSingletonEntryRevisionUseCase)
            .execute(model, first.id);
        expect(deleteFirst.isFail()).toBe(true);
        expect(deleteFirst.error.message).toBe(
            "The first revision of a singleton entry cannot be deleted."
        );
    });

    it("should require a revision id, and reject foreign revisions", async () => {
        const { container, model, entryId } = await setupTagged();

        const operations = [
            container.resolve(CreateSingletonEntryRevisionFromUseCase),
            container.resolve(PublishSingletonEntryUseCase),
            container.resolve(UnpublishSingletonEntryUseCase)
        ];
        for (const useCase of operations) {
            const idOnly = await useCase.execute(model, entryId);
            expect(idOnly.isFail()).toBe(true);
            expect(idOnly.error.message).toBe(REVISION_REQUIRED);

            const foreign = await useCase.execute(model, "foreignentry#0001");
            expect(foreign.isFail()).toBe(true);
            expect(foreign.error).toBeInstanceOf(EntryNotFoundError);
        }

        const deleteUseCase = container.resolve(DeleteSingletonEntryRevisionUseCase);
        const deleteIdOnly = await deleteUseCase.execute(model, entryId);
        expect(deleteIdOnly.isFail()).toBe(true);
        expect(deleteIdOnly.error.message).toBe(NO_DELETE);

        const deleteForeign = await deleteUseCase.execute(model, "foreignentry#0001");
        expect(deleteForeign.isFail()).toBe(true);
        expect(deleteForeign.error).toBeInstanceOf(EntryNotFoundError);
    });
});

describe("singleton use cases - untagged model", () => {
    const setupUntagged = useSetup(untaggedPlugins);

    it("GetLatestSingletonEntry returns #0001 even with a leftover #0002", async () => {
        const setup = await setupUntagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);

        const result = await container.resolve(GetLatestSingletonEntryUseCase).execute(model);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0001`);
    });

    it("GetLatestSingletonEntry and GetPublishedSingletonEntry create the entry when missing", async () => {
        const { container, model, entryId } = await setupUntagged();

        const published = await container.resolve(GetPublishedSingletonEntryUseCase).execute(model);
        expect(published.isOk()).toBe(true);
        expect(published.value.id).toBe(`${entryId}#0001`);

        const latest = await container.resolve(GetLatestSingletonEntryUseCase).execute(model);
        expect(latest.isOk()).toBe(true);
        expect(latest.value.id).toBe(`${entryId}#0001`);
    });

    it("GetPublishedSingletonEntry returns #0001 with its values", async () => {
        const setup = await setupUntagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);

        const result = await container.resolve(GetPublishedSingletonEntryUseCase).execute(model);
        expect(result.isOk()).toBe(true);
        expect(result.value.id).toBe(`${entryId}#0001`);
        expect(result.value.values.title).toBe("Title");
    });

    it("ListSingletonEntryRevisions returns only #0001", async () => {
        const setup = await setupUntagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);
        const useCase = container.resolve(ListSingletonEntryRevisionsUseCase);

        const byEntryId = await useCase.execute(model, entryId);
        expect(byEntryId.isOk()).toBe(true);
        expect(byEntryId.value.map(entry => entry.id)).toEqual([`${entryId}#0001`]);

        const byRevisionId = await useCase.execute(model, `${entryId}#0002`);
        expect(byRevisionId.isOk()).toBe(true);
        expect(byRevisionId.value.map(entry => entry.id)).toEqual([`${entryId}#0001`]);
    });

    it("should work on #0001 and reject later revisions", async () => {
        const setup = await setupUntagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);

        const get = container.resolve(GetSingletonEntryRevisionUseCase);
        const update = container.resolve(UpdateSingletonEntryUseCase);
        const describe = container.resolve(UpdateSingletonEntryRevisionDescriptionUseCase);

        const getFirst = await get.execute(model, `${entryId}#0001`);
        expect(getFirst.isOk()).toBe(true);

        const getSecond = await get.execute(model, `${entryId}#0002`);
        expect(getSecond.isFail()).toBe(true);
        expect(getSecond.error.message).toBe(NO_REVISIONS);

        const updateFirst = await update.execute(model, `${entryId}#0001`, {
            values: { title: "Edited", slug: "edited" }
        });
        expect(updateFirst.isOk()).toBe(true);

        const updateSecond = await update.execute(model, `${entryId}#0002`, { values });
        expect(updateSecond.isFail()).toBe(true);
        expect(updateSecond.error.message).toBe(NO_REVISIONS);

        const describeFirst = await describe.execute(model, `${entryId}#0001`, "Text");
        expect(describeFirst.isOk()).toBe(true);

        const describeSecond = await describe.execute(model, `${entryId}#0002`, "Text");
        expect(describeSecond.isFail()).toBe(true);
        expect(describeSecond.error.message).toBe(NO_REVISIONS);
    });

    it("should reject publishing operations", async () => {
        const setup = await setupUntagged();
        const { container, model, entryId } = setup;
        await seed(setup, 2);

        const operations = [
            container.resolve(CreateSingletonEntryRevisionFromUseCase),
            container.resolve(PublishSingletonEntryUseCase),
            container.resolve(UnpublishSingletonEntryUseCase),
            container.resolve(DeleteSingletonEntryRevisionUseCase)
        ];
        for (const useCase of operations) {
            const first = await useCase.execute(model, `${entryId}#0001`);
            expect(first.isFail()).toBe(true);
            expect(first.error.message).toBe(NO_PUBLISHING);

            const second = await useCase.execute(model, `${entryId}#0002`);
            expect(second.isFail()).toBe(true);
            expect(second.error.message).toBe(NO_PUBLISHING);
        }

        const deleteIdOnly = await container
            .resolve(DeleteSingletonEntryRevisionUseCase)
            .execute(model, entryId);
        expect(deleteIdOnly.isFail()).toBe(true);
        expect(deleteIdOnly.error.message).toBe(NO_DELETE);

        const publishIdOnly = await container
            .resolve(PublishSingletonEntryUseCase)
            .execute(model, entryId);
        expect(publishIdOnly.isFail()).toBe(true);
        expect(publishIdOnly.error.message).toBe(REVISION_REQUIRED);
    });
});
