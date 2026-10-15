import { describe, expect, it } from "vitest";
import { createContextPlugin } from "@webiny/api";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import {
    CreatePageUseCase,
    PageBeforeCreateEventHandler
} from "~/features/pages/CreatePage/index.js";
import {
    PageBeforeUpdateEventHandler,
    UpdatePageUseCase
} from "~/features/pages/UpdatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import {
    PageBeforePublishEventHandler,
    PublishPageUseCase
} from "~/features/pages/PublishPage/index.js";
import {
    CreatePageRevisionFromUseCase,
    PageBeforeCreateRevisionFromEventHandler
} from "~/features/pages/CreatePageRevisionFrom/index.js";

/*
 * "Before" event handlers run after authorization and before the write. Whatever they leave in
 * `input` is what gets saved, and throwing stops the write. The handlers below replace the
 * object instead of editing it in place, because an in-place edit can reach the write through a
 * shared object even when the event's value is never passed on.
 */
const setup = async (register: Parameters<typeof createContextPlugin>[0]) => {
    const handler = useHandler({ plugins: [createContextPlugin(register)] });
    const context = await handler.handler();

    const createResult = await context.container
        .resolve(CreatePageUseCase)
        .execute(pageMocks.pageA);
    if (createResult.isFail()) {
        throw createResult.error;
    }

    const getStored = async (id: string) => {
        const result = await context.container.resolve(GetPageByIdUseCase).execute(id);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    };

    return { context, page: createResult.value, getStored };
};

describe("Page before-event handlers", () => {
    it("creates the page with the input a page.beforeCreate handler replaced", async () => {
        const { page, getStored } = await setup(context => {
            context.container.registerFactory(PageBeforeCreateEventHandler, () => ({
                async handle(event) {
                    const { input } = event.payload;
                    event.payload.input = {
                        ...input,
                        properties: { ...input.properties, title: "Changed before create" }
                    };
                }
            }));
        });

        expect(page.properties.title).toBe("Changed before create");
        expect((await getStored(page.id)).properties.title).toBe("Changed before create");
    });

    it("updates the page with the data a page.beforeUpdate handler replaced", async () => {
        const { context, page, getStored } = await setup(context => {
            context.container.registerFactory(PageBeforeUpdateEventHandler, () => ({
                async handle(event) {
                    const { original, input } = event.payload;
                    expect(original.properties.title).toBe("Page A");
                    input.data = {
                        ...input.data,
                        properties: { ...input.data.properties, title: "Changed before update" }
                    };
                }
            }));
        });

        const result = await context.container.resolve(UpdatePageUseCase).execute(page.id, {
            properties: { ...page.properties, title: "Typed by the user" }
        });
        if (result.isFail()) {
            throw result.error;
        }

        expect(result.value.properties.title).toBe("Changed before update");
        expect((await getStored(page.id)).properties.title).toBe("Changed before update");
    });

    it("publishes the data a page.beforePublish handler replaced", async () => {
        const { context, page, getStored } = await setup(context => {
            context.container.registerFactory(PageBeforePublishEventHandler, () => ({
                async handle(event) {
                    const { original, input } = event.payload;
                    expect(original.id).toBe(input.id);
                    input.data = {
                        ...input.data,
                        properties: { ...input.data.properties, title: "Changed before publish" }
                    };
                }
            }));
        });

        const result = await context.container.resolve(PublishPageUseCase).execute({ id: page.id });
        if (result.isFail()) {
            throw result.error;
        }

        expect(result.value.status).toBe("published");
        expect(result.value.properties.title).toBe("Changed before publish");

        const stored = await getStored(page.id);
        expect(stored.status).toBe("published");
        expect(stored.properties.title).toBe("Changed before publish");
    });

    it("does not publish when a page.beforePublish handler throws", async () => {
        const { context, page, getStored } = await setup(context => {
            context.container.registerFactory(PageBeforePublishEventHandler, () => ({
                async handle() {
                    throw new Error("Page is not ready to be published.");
                }
            }));
        });

        await expect(
            context.container.resolve(PublishPageUseCase).execute({ id: page.id })
        ).rejects.toThrow("Page is not ready to be published.");

        expect((await getStored(page.id)).status).toBe("draft");
    });

    it("creates the revision with the data a page.beforeCreateRevisionFrom handler replaced", async () => {
        const { context, page, getStored } = await setup(context => {
            context.container.registerFactory(PageBeforeCreateRevisionFromEventHandler, () => ({
                async handle(event) {
                    const { original, input, params } = event.payload;
                    expect(original.id).toBe(params.id);
                    input.data = {
                        ...input.data,
                        properties: { ...input.data.properties, title: "Changed in new revision" }
                    };
                }
            }));
        });

        const result = await context.container
            .resolve(CreatePageRevisionFromUseCase)
            .execute({ id: page.id });
        if (result.isFail()) {
            throw result.error;
        }

        expect(result.value.version).toBe(2);
        expect(result.value.properties.title).toBe("Changed in new revision");

        // The source revision is left as it was.
        expect((await getStored(page.id)).properties.title).toBe("Page A");
    });

    it("does not create a revision when a page.beforeCreateRevisionFrom handler throws", async () => {
        const { context, page } = await setup(context => {
            context.container.registerFactory(PageBeforeCreateRevisionFromEventHandler, () => ({
                async handle() {
                    throw new Error("No new revisions for this page.");
                }
            }));
        });

        await expect(
            context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        ).rejects.toThrow("No new revisions for this page.");
    });
});
