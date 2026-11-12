import { describe, it, expect, beforeEach } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-core/features/websockets/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import {
    GetLatestDeletedRevisionByEntryIdUseCase,
    GetLatestRevisionByEntryIdUseCase
} from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import {
    ENTRY_CREATED_WEBSOCKET_ACTION,
    ENTRY_DELETED_WEBSOCKET_ACTION,
    ENTRY_UPDATED_WEBSOCKET_ACTION
} from "~/features/ai/NotifyEntryChange/index.js";
import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "../lifecycleHooks/mocks/article.model";
import { createModelPlugin } from "~/plugins/index.js";
import { createModelField } from "~/utils/createModelField.js";
import type { CmsModel } from "~/types/index.js";

// A plain content model. `articleModel` is private, which the write tools refuse.
const guideModel = createModelPlugin({
    modelId: "guide",
    name: "Guide",
    group: "ungrouped",
    singularApiName: "Guide",
    pluralApiName: "Guides",
    description: "",
    titleFieldId: "title",
    fields: [
        createModelField({ label: "Title", type: "text", fieldId: "title" }),
        createModelField({ label: "Summary", type: "text", fieldId: "summary" })
    ],
    layout: [["title"], ["summary"]]
} as any);

interface SentMessage {
    action?: string;
    data?: unknown;
}

interface ToolEntry {
    id: string;
    entryId: string;
    status: string;
    values: Record<string, unknown>;
    newRevision?: boolean;
}

const getTool = (container: Container, name: string) => {
    const tool = container
        .resolveAll(AiSdkToolDefinition)
        .find(candidate => candidate.name === name);

    if (!tool) {
        throw new Error(`Tool "${name}" is not registered.`);
    }

    return container.resolveImplementation(tool.handler);
};

/*
 * Runs the real tools, use cases and storage. What the tools sent to the user's open tabs is
 * recorded, since there is no socket server in tests.
 */
describe("entry write tools", () => {
    const sent: SentMessage[] = [];

    const { handler, tenant } = useHandler({
        plugins: [
            guideModel,
            articleModel,
            (container: Container) => {
                container.registerInstance(WebsocketsSendToIdentityUseCase, {
                    async execute(_identity, data) {
                        sent.push({ action: data.action, data: data.data });
                        return Result.ok();
                    }
                });
            }
        ]
    });

    let container: Container;
    let model: CmsModel;

    beforeEach(async () => {
        const context = await handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });
        container = context.container;
        model = (await container.resolve(GetModelUseCase).execute("guide")).value;
        sent.length = 0;
    });

    const create = async (title: string) => {
        return (await getTool(container, "createEntry").execute({
            modelId: "guide",
            values: { title }
        })) as ToolEntry;
    };

    const latest = async (entryId: string) => {
        const result = await container
            .resolve(GetLatestRevisionByEntryIdUseCase)
            .execute(model, { id: entryId });
        return result.isOk() ? result.value : null;
    };

    it("creates a draft and tells the user's tabs", async () => {
        const created = await create("Coffee guide");

        expect(created).toMatchObject({ status: "draft", values: { title: "Coffee guide" } });
        expect(sent).toEqual([
            {
                action: ENTRY_CREATED_WEBSOCKET_ACTION,
                data: { modelId: "guide", entryId: created.entryId }
            }
        ]);
    });

    it("updates a draft in place, keeping the fields it was not given", async () => {
        const created = await create("Coffee guide");
        sent.length = 0;

        const updated = (await getTool(container, "updateEntry").execute({
            modelId: "guide",
            entryId: created.entryId,
            values: { summary: "Grind, bloom, pour." }
        })) as ToolEntry;

        expect(updated.id).toBe(created.id);
        expect(updated.newRevision).toBe(false);
        expect(updated.values).toMatchObject({
            title: "Coffee guide",
            summary: "Grind, bloom, pour."
        });
        expect(sent).toEqual([
            {
                action: ENTRY_UPDATED_WEBSOCKET_ACTION,
                data: { modelId: "guide", entryId: created.entryId }
            }
        ]);
    });

    it("puts a change to a published entry into a new draft revision, leaving the published one live", async () => {
        const created = await create("Coffee guide");
        await getTool(container, "publishEntry").execute({
            modelId: "guide",
            entryId: created.entryId
        });

        const updated = (await getTool(container, "updateEntry").execute({
            modelId: "guide",
            entryId: created.entryId,
            values: { title: "Coffee guide, second edition" }
        })) as ToolEntry;

        expect(updated.newRevision).toBe(true);
        expect(updated.id).not.toBe(created.id);
        expect(updated.status).toBe("draft");

        const published = await container
            .resolve(GetPublishedRevisionByEntryIdUseCase)
            .execute(model, created.entryId);
        expect(published.isOk() && published.value?.values.title).toBe("Coffee guide");
    });

    it("publishes and unpublishes, and refuses to publish twice", async () => {
        const created = await create("Coffee guide");

        const published = (await getTool(container, "publishEntry").execute({
            modelId: "guide",
            entryId: created.entryId
        })) as ToolEntry;
        expect(published.status).toBe("published");

        await expect(
            getTool(container, "publishEntry").execute({
                modelId: "guide",
                entryId: created.entryId
            })
        ).rejects.toThrow("is already published");

        const unpublished = (await getTool(container, "unpublishEntry").execute({
            modelId: "guide",
            entryId: created.entryId
        })) as ToolEntry;
        expect(unpublished.status).toBe("unpublished");

        await expect(
            getTool(container, "unpublishEntry").execute({
                modelId: "guide",
                entryId: created.entryId
            })
        ).rejects.toThrow("is not published");
    });

    it("moves an entry to the bin only when the title matches", async () => {
        const created = await create("Coffee guide");
        sent.length = 0;

        await expect(
            getTool(container, "deleteEntry").execute({
                modelId: "guide",
                entryId: created.entryId,
                title: "Tea guide"
            })
        ).rejects.toThrow('is titled "Coffee guide", not "Tea guide"');
        expect(await latest(created.entryId)).not.toBeNull();
        expect(sent).toEqual([]);

        await getTool(container, "deleteEntry").execute({
            modelId: "guide",
            entryId: created.entryId,
            title: "Coffee guide"
        });

        // Gone from the normal reads, but in the bin rather than destroyed.
        expect(await latest(created.entryId)).toBeNull();
        const inBin = await container
            .resolve(GetLatestDeletedRevisionByEntryIdUseCase)
            .execute(model, { id: created.entryId });
        expect(inBin.isOk()).toBe(true);
        expect(sent).toEqual([
            {
                action: ENTRY_DELETED_WEBSOCKET_ACTION,
                data: { modelId: "guide", entryId: created.entryId }
            }
        ]);
    });

    it("refuses a private model", async () => {
        await expect(
            getTool(container, "createEntry").execute({
                modelId: "article",
                values: { title: "Coffee guide" }
            })
        ).rejects.toThrow('"article" is a system model');
    });

    it("refuses an unknown model", async () => {
        await expect(
            getTool(container, "createEntry").execute({ modelId: "nope", values: {} })
        ).rejects.toThrow('Unknown model "nope"');
    });
});
