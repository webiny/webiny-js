import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { WebsiteBuilderContext } from "~/context/types.js";
import type { WbPageCrud } from "./pages/pages.types.js";
import type { WbRedirectCrud } from "./redirects/redirects.types.js";
import { PagesContext } from "./pages/pages.context.js";
import { RedirectsContext } from "~/context/redirects/redirects.context.js";
import { InvalidateRedirectsCache } from "~/features/redirects/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export class WebsiteBuilder {
    private readonly context: WebsiteBuilderContext;
    private pagesContext: WbPageCrud | undefined;
    private redirectsContext: WbRedirectCrud | undefined;

    private constructor(context: WebsiteBuilderContext) {
        this.context = context;
    }

    private async init() {
        this.pagesContext = await PagesContext.create(this.context);
        this.redirectsContext = await RedirectsContext.create(this.context);
        this.invalidateCacheOnRedirectEvents();
    }

    private invalidateCacheOnRedirectEvents() {
        this.redirects.onRedirectAfterCreate.subscribe(async ({ redirect }) => {
            if (redirect.isEnabled) {
                await this.invalidateCache();
            }
        });

        this.redirects.onRedirectAfterUpdate.subscribe(async ({ redirect, original }) => {
            if (
                redirect.redirectFrom !== original.redirectFrom ||
                redirect.redirectTo !== original.redirectTo ||
                redirect.isEnabled !== original.isEnabled
            ) {
                await this.invalidateCache();
            }
        });

        this.redirects.onRedirectAfterDelete.subscribe(async ({ redirect }) => {
            if (redirect.isEnabled) {
                await this.invalidateCache();
            }
        });
    }

    private async invalidateCache() {
        const taskService = this.context.container.resolve(TaskService);
        const invalidateRedirectsCache = new InvalidateRedirectsCache(taskService);
        await invalidateRedirectsCache.execute();
    }

    get pages() {
        return this.pagesContext!;
    }

    get redirects() {
        return this.redirectsContext!;
    }

    static async create(context: WebsiteBuilderContext): Promise<WebsiteBuilder> {
        const websiteBuilder = new WebsiteBuilder(context);

        if (!(await isHeadlessCmsReady(context))) {
            return websiteBuilder;
        }

        await websiteBuilder.init();
        return websiteBuilder;
    }
}
