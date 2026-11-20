import { Result } from "@webiny/sdk";
import { contentSdk as wbContentSdk, registerComponentGroup } from "@webiny/website-builder-sdk";
import type {
    GetLayoutParams,
    PublicLayout,
    PublicPage,
    PublicRedirect,
    ListPagesOptions,
    ListPagesResult,
    Component as WbComponent,
    ComponentGroup
} from "@webiny/website-builder-sdk";
import { resolveContentEntries } from "./resolveContentEntries.js";

export class WbSdk {
    async getPage(path: string): Promise<Result<PublicPage, Error>> {
        const page = await wbContentSdk.getPage(path);

        if (!page) {
            return Result.fail(new Error(`Page "${path}" not found.`));
        }

        await resolveContentEntries(page);

        return Result.ok(page);
    }

    /**
     * The published layout with the slug, in its version in `language` (or else the source layout), composed
     * with that language's global components. `null` when no such layout is published.
     */
    getLayout(params: GetLayoutParams): Promise<Result<PublicLayout | null, Error>> {
        return wbContentSdk.getLayout(params).then(layout => Result.ok(layout));
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
