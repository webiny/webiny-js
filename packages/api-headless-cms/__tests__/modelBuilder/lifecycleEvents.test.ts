import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsModel } from "~/types";
import { useHandler } from "~tests/testHelpers/useHandler";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import {
    CreateEntryUseCase,
    EntryAfterCreateEventHandler,
    EntryBeforeCreateEventHandler
} from "~/features/contentEntry/CreateEntry/index.js";
import {
    EntryAfterUpdateEventHandler,
    EntryBeforeUpdateEventHandler,
    UpdateEntryUseCase
} from "~/features/contentEntry/UpdateEntry/index.js";
import {
    EntryAfterPublishEventHandler,
    EntryBeforePublishEventHandler,
    PublishEntryUseCase
} from "~/features/contentEntry/PublishEntry/index.js";
import {
    DeleteEntryUseCase,
    EntryAfterDeleteEventHandler,
    EntryBeforeDeleteEventHandler
} from "~/features/contentEntry/DeleteEntry/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";
import { ContextPlugin } from "@webiny/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";

const PRIVATE_WITH_EVENTS = "privateWithEvents";
const PRIVATE_WITHOUT_EVENTS = "privateWithoutEvents";
const PUBLIC_WITH_SETTING = "publicWithSetting";

class TestModelsImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({ modelId: PRIVATE_WITH_EVENTS, name: "Private With Events" })
                .fields(fields => ({ title: fields.text().label("Title") })),
            builder
                .private({
                    modelId: PRIVATE_WITHOUT_EVENTS,
                    name: "Private Without Events",
                    lifecycleEvents: false
                })
                .fields(fields => ({ title: fields.text().label("Title") })),
            builder
                .public({
                    modelId: PUBLIC_WITH_SETTING,
                    name: "Public With Setting",
                    group: "ungrouped"
                })
                // The flag is only honored for private models.
                .settings({ lifecycleEvents: false })
                .fields(fields => ({ title: fields.text().label("Title") }))
        ] as any;
    }
}

const TestModels = ModelFactory.createImplementation({
    implementation: TestModelsImpl,
    dependencies: []
});

const handlers = [
    EntryBeforeCreateEventHandler,
    EntryAfterCreateEventHandler,
    EntryBeforeUpdateEventHandler,
    EntryAfterUpdateEventHandler,
    EntryBeforePublishEventHandler,
    EntryAfterPublishEventHandler,
    EntryBeforeDeleteEventHandler,
    EntryAfterDeleteEventHandler
];

describe("Private model lifecycle events", () => {
    let context: CmsContext;
    let events: Record<string, string[]>;

    beforeEach(async () => {
        events = {};

        const { handler } = useHandler({
            plugins: [
                createRegisterExtensionPlugin(ctx => {
                    ctx.container.register(TestModels);
                }),
                new ContextPlugin<CmsContext>(async ctx => {
                    for (const abstraction of handlers) {
                        ctx.container.registerFactory(abstraction as any, () => ({
                            async handle(event: any) {
                                const { modelId } = event.payload.model;
                                events[modelId] = [...(events[modelId] || []), event.eventType];
                            }
                        }));
                    }
                })
            ]
        });

        context = await handler({
            path: "/cms/manage",
            headers: {
                "x-tenant": "root",
                "x-webiny-cms-endpoint": "manage"
            }
        });
    });

    const getModel = async (modelId: string): Promise<CmsModel> => {
        const result = await context.container.resolve(GetModelUseCase).execute(modelId);
        return result.value;
    };

    /**
     * Runs create -> update -> publish -> delete, and returns the entry ID.
     */
    const runLifecycle = async (model: CmsModel) => {
        const { container } = context;

        return context.security.withoutAuthorization(async () => {
            const created = await container
                .resolve(CreateEntryUseCase)
                .execute(model, { values: { title: "Entry" } });
            expect(created.isOk()).toBe(true);

            const updated = await container
                .resolve(UpdateEntryUseCase)
                .execute(model, created.value.id, { values: { title: "Entry updated" } });
            expect(updated.isOk()).toBe(true);

            const published = await container
                .resolve(PublishEntryUseCase)
                .execute(model, created.value.id);
            expect(published.isOk()).toBe(true);

            const fetched = await container
                .resolve(GetEntryByIdUseCase)
                .execute(model, created.value.id);
            expect(fetched.value.values.title).toBe("Entry updated");
            expect(fetched.value.status).toBe("published");

            const deleted = await container
                .resolve(DeleteEntryUseCase)
                .execute(model, created.value.entryId, { permanently: true });
            expect(deleted.isOk()).toBe(true);

            return created.value;
        });
    };

    it("should store the flag in private model settings", async () => {
        const models = await context.container.resolve(ModelsProvider).list("root");

        const withEvents = models.find(m => m.modelId === PRIVATE_WITH_EVENTS);
        const withoutEvents = models.find(m => m.modelId === PRIVATE_WITHOUT_EVENTS);

        expect(withEvents?.settings?.lifecycleEvents).toBeUndefined();
        expect(withoutEvents?.isPrivate).toBe(true);
        expect(withoutEvents?.settings?.lifecycleEvents).toBe(false);
    });

    it("should publish lifecycle events for a private model by default", async () => {
        const model = await getModel(PRIVATE_WITH_EVENTS);
        await runLifecycle(model);

        expect(events[PRIVATE_WITH_EVENTS]).toEqual([
            "Cms/Entry/BeforeCreate",
            "Cms/Entry/AfterCreate",
            "Cms/Entry/BeforeUpdate",
            "Cms/Entry/AfterUpdate",
            "Cms/Entry/BeforePublish",
            "Cms/Entry/AfterPublish",
            "Cms/Entry/BeforeDelete",
            "Cms/Entry/AfterDelete"
        ]);
    });

    it("should not publish lifecycle events for a private model with lifecycleEvents: false", async () => {
        const model = await getModel(PRIVATE_WITHOUT_EVENTS);
        await runLifecycle(model);

        expect(events[PRIVATE_WITHOUT_EVENTS]).toBeUndefined();
    });

    it("should ignore the lifecycleEvents setting on public models", async () => {
        const model = await getModel(PUBLIC_WITH_SETTING);
        await runLifecycle(model);

        expect(events[PUBLIC_WITH_SETTING]).toHaveLength(8);
    });
});
