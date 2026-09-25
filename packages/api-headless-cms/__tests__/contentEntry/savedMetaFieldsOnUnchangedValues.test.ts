import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "~tests/contentTraverser/mocks/article.model";
import { richTextMock } from "~tests/contentAPI/mocks/richTextValue.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { RestoreEntryFromBinUseCase } from "~/features/contentEntry/RestoreEntryFromBin/index.js";
import type { CmsEntry } from "~/types";

/**
 * Saving an entry without changing its content must not update the saved/modified meta fields.
 *
 * These tests go through the use cases (not GraphQL), passing back the stored values exactly like
 * the Admin does, including the `_id` of object and dynamic zone items. They cover field types
 * whose values are normalized on save: refs, rich text, dynamic zones, and nested object lists.
 */
const HERO_TEMPLATE = "cv2zf965v324ivdc7e1vt";
const SETTINGS_TEMPLATE = "9ht43gurhegkbdfsaafyads";
const AD_TEMPLATE = "0emukbsvmzpozx2lzk883";

const createArticleValues = () => ({
    title: "Article",
    body: richTextMock,
    categories: [{ modelId: "category", id: "category-1#0001" }],
    content: [
        {
            _templateId: HERO_TEMPLATE,
            title: "Hero"
        },
        {
            _templateId: SETTINGS_TEMPLATE,
            settings: {
                title: "Settings",
                seo: [{ title: "SEO #1" }, { title: "SEO #2" }]
            },
            dynamicZone: {
                _templateId: AD_TEMPLATE,
                authors: [{ modelId: "author", id: "author-1#0001" }]
            }
        }
    ]
});

const pickSavedFields = (entry: CmsEntry) => ({
    savedOn: entry.savedOn,
    savedBy: entry.savedBy,
    modifiedOn: entry.modifiedOn,
    modifiedBy: entry.modifiedBy
});

const waitForClockTick = () => new Promise(resolve => setTimeout(resolve, 5));

describe("Saved/modified meta fields with unchanged values", () => {
    const { handler, tenant } = useHandler({
        plugins: [articleModel]
    });

    const getContext = () =>
        handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });

    const getModel = async () => {
        const context = await getContext();
        const model = await context.cms.getModel("article");
        if (!model) {
            throw new Error(`Missing "article" model!`);
        }
        return { context, model };
    };

    const createStoredArticle = async (): Promise<CmsEntry> => {
        const { context, model } = await getModel();
        const created = await context.container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: createArticleValues() });
        if (created.isFail()) {
            throw created.error;
        }
        return getStored(created.value.id);
    };

    const getStored = async (id: string): Promise<CmsEntry> => {
        const { context, model } = await getModel();
        const result = await context.container.resolve(GetRevisionByIdUseCase).execute(model, id);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    };

    it("should keep saved/modified fields when updating with the stored values", async () => {
        const stored = await createStoredArticle();

        // Sanity check: the stored items carry the `_id` values the Admin sends back.
        expect(stored.values.content[0]._id).toEqual(expect.any(String));
        expect(stored.values.content[1].settings.seo[0]._id).toEqual(expect.any(String));

        await waitForClockTick();

        const { context, model } = await getModel();
        const updated = await context.container
            .resolve(UpdateEntryUseCase)
            .execute(model, stored.id, { values: structuredClone(stored.values) });
        if (updated.isFail()) {
            throw updated.error;
        }

        const storedAfter = await getStored(stored.id);
        expect(pickSavedFields(storedAfter)).toEqual(pickSavedFields(stored));
        expect(storedAfter.revisionSavedOn).toBe(stored.revisionSavedOn);
        expect(storedAfter.values).toEqual(stored.values);
    });

    it("should update saved/modified fields when a nested value changes", async () => {
        const stored = await createStoredArticle();
        await waitForClockTick();

        const values = structuredClone(stored.values);
        values.content[1].settings.seo[1].title = "SEO #2 changed";

        const { context, model } = await getModel();
        const updated = await context.container
            .resolve(UpdateEntryUseCase)
            .execute(model, stored.id, { values });
        if (updated.isFail()) {
            throw updated.error;
        }

        const storedAfter = await getStored(stored.id);
        expect(storedAfter.savedOn > stored.savedOn).toBe(true);
        expect(storedAfter.modifiedOn! > (stored.modifiedOn || "")).toBe(true);
    });

    it("should keep entry-level saved/modified fields when creating a revision with the stored values", async () => {
        const stored = await createStoredArticle();
        await waitForClockTick();

        const { context, model } = await getModel();
        const created = await context.container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, stored.id, { values: structuredClone(stored.values) });
        if (created.isFail()) {
            throw created.error;
        }

        const newRevision = await getStored(created.value.id);
        expect(pickSavedFields(newRevision)).toEqual(pickSavedFields(stored));
        expect(newRevision.values).toEqual(stored.values);
    });

    it("should keep restoredOn/restoredBy when updating a restored entry", async () => {
        const created = await createStoredArticle();

        const { context: deleteContext, model } = await getModel();
        const deleted = await deleteContext.container
            .resolve(DeleteEntryUseCase)
            .execute(model, created.entryId, { permanently: false });
        if (deleted.isFail()) {
            throw deleted.error;
        }

        const { context: restoreContext } = await getModel();
        const restored = await restoreContext.container
            .resolve(RestoreEntryFromBinUseCase)
            .execute(model, created.entryId);
        if (restored.isFail()) {
            throw restored.error;
        }

        const stored = await getStored(created.id);
        expect(stored.restoredOn).toEqual(expect.any(String));
        expect(stored.restoredBy).toEqual(expect.objectContaining({ id: expect.any(String) }));

        const values = structuredClone(stored.values);
        values.title = "Changed after restore";

        const { context } = await getModel();
        const updated = await context.container
            .resolve(UpdateEntryUseCase)
            .execute(model, stored.id, { values });
        if (updated.isFail()) {
            throw updated.error;
        }

        const storedAfter = await getStored(stored.id);
        expect(storedAfter.values.title).toBe("Changed after restore");
        expect(storedAfter.restoredOn).toBe(stored.restoredOn);
        expect(storedAfter.restoredBy).toEqual(stored.restoredBy);
        expect(storedAfter.revisionRestoredOn).toBe(stored.revisionRestoredOn);
        expect(storedAfter.revisionRestoredBy).toEqual(stored.revisionRestoredBy);
    });
});
