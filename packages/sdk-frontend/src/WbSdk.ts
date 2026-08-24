import { Result } from "@webiny/sdk";
import { contentSdk as wbContentSdk, registerComponentGroup } from "@webiny/website-builder-sdk";
import type {
    PublicPage,
    PublicRedirect,
    ListPagesOptions,
    ListPagesResult,
    Component as WbComponent,
    ComponentGroup
} from "@webiny/website-builder-sdk";
import { resolveContentEntries } from "./resolveContentEntries.js";

export interface GetPageOptions {
    components?: WbComponent[];
}

export class WbSdk {
    async getPage(path: string, options?: GetPageOptions): Promise<Result<PublicPage, Error>> {
        const page = await wbContentSdk.getPage(path);

        if (!page) {
            return Result.fail(new Error(`Page "${path}" not found.`));
        }

        if (options?.components) {
            await resolveContentEntries(page, options.components);
        }

        return Result.ok(page);
    }

    listPages(options?: ListPagesOptions): Promise<Result<ListPagesResult, Error>> {
        return wbContentSdk.listPages(options).then(result => Result.ok(result));
    }

    getAllRedirects(): Promise<Result<Map<string, PublicRedirect>, Error>> {
        return wbContentSdk.getAllRedirects().then(redirects => Result.ok(redirects));
    }

    getRedirectByPath(path: string): Promise<Result<PublicRedirect | undefined, Error>> {
        return wbContentSdk.getRedirectByPath(path).then(redirect => Result.ok(redirect));
    }

    registerComponent(blueprint: WbComponent): void {
        wbContentSdk.registerComponent(blueprint);
    }

    registerComponentGroup(group: ComponentGroup): void {
        registerComponentGroup(group);
    }

    isPreviewing(): boolean {
        return wbContentSdk.isPreviewing();
    }
}
