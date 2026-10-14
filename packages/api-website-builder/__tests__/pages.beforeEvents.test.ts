import { describe, expect, it } from "vitest";
import { createContextPlugin } from "@webiny/api";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
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
 * "Before" event handlers run after authorization and before the write. Whatever they leave on
 * the page is what gets saved, and throwing stops the write. The handlers below replace
 * `properties` instead of editing it in place, because an in-place edit can reach the write
 * through a shared object even when the page itself is never passed on.
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

    return { context, page: createResult.value };
};

describe("Page before-event handlers", () => {
    it("publishes the page as a page.beforePublish handler changed it", async () => {
        const { context, page } = await setup(context => {
            context.container.registerFactory(PageBeforePublishEventHandler, () => ({
                async handle(event) {
                    const { page } = event.payload;
                    page.properties = { ...page.properties, title: "Changed before publish" };
                }
            }));
        });

        const result = await context.container.resolve(PublishPageUseCase).execute({ id: page.id });
        if (result.isFail()) {
            throw result.error;
        }

        expect(result.value.status).toBe("published");
        expect(result.value.properties.title).toBe("Changed before publish");

        const stored = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        if (stored.isFail()) {
            throw stored.error;
        }
        expect(stored.value.status).toBe("published");
        expect(stored.value.properties.title).toBe("Changed before publish");
    });

    it("does not publish when a page.beforePublish handler throws", async () => {
        const { context, page } = await setup(context => {
            context.container.registerFactory(PageBeforePublishEventHandler, () => ({
                async handle() {
                    throw new Error("Page is not ready to be published.");
                }
            }));
        });

        await expect(
            context.container.resolve(PublishPageUseCase).execute({ id: page.id })
        ).rejects.toThrow("Page is not ready to be published.");

        const stored = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        if (stored.isFail()) {
            throw stored.error;
        }
        expect(stored.value.status).toBe("draft");
    });

    it("creates the revision as a page.beforeCreateRevisionFrom handler changed it", async () => {
        const { context, page } = await setup(context => {
            context.container.registerFactory(PageBeforeCreateRevisionFromEventHandler, () => ({
                async handle(event) {
                    const { page, params } = event.payload;
                    expect(page.id).toBe(params.id);
                    page.properties = { ...page.properties, title: "Changed in new revision" };
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
        const source = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        if (source.isFail()) {
            throw source.error;
        }
        expect(source.value.properties.title).toBe("Page A");
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
