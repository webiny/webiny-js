import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * Provides the tenant's private Website Builder global component CMS model, like `PageModelProvider`:
 * fetching a model is asynchronous and tenant-dependent, so consumers `await get()` at the point of use.
 */
export interface IGlobalComponentModelProvider {
    get(): Promise<CmsModel>;
}

export const GlobalComponentModelProvider = createAbstraction<IGlobalComponentModelProvider>(
    "Wb/GlobalComponentModelProvider"
);

export namespace GlobalComponentModelProvider {
    export type Interface = IGlobalComponentModelProvider;
}

export interface CmsEntryWbGlobalComponent {
    name: string;
    // Code of the language the record holds the global in; `"default"` for pages without a language.
    language: string;
    /**
     * Keeps apart records of the same name and language that belong to different parts of one tenant.
     * Core never sets it: an extension that serves several sites from one tenant passes it (e.g. by
     * decorating the repositories). Records without a scope are what everyone else reads and writes.
     */
    scope?: string;
    elements: Record<string, any>;
    bindings: Record<string, any>;
}

/**
 * The stored instance of one global component in one language: its `$global:{name}` element,
 * everything inside it, and their bindings. Each global component is stored as its own record
 * per language.
 */
export type GlobalComponent = CmsEntryWbGlobalComponent;
