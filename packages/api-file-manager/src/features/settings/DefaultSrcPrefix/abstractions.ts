import { createAbstraction } from "@webiny/feature/api";

export interface IDefaultSrcPrefix {
    /**
     * The file delivery URL used when no custom one is set: the API's public URL plus `/files/`.
     * Empty when the API URL is unknown.
     */
    get(): Promise<string>;
}

/**
 * The default `srcPrefix`. Computed on every read rather than stored, so file URLs follow the API
 * when its public URL changes (a custom domain added, a container moved).
 *
 * Replace this to change the default itself: it is what settings fall back to, what the Admin
 * settings form shows as the placeholder, and what a save compares against. Replace
 * `FileUrlPrefixProvider` instead to change the prefix of generated file URLs regardless of the
 * settings; the settings form will not know about it.
 */
export const DefaultSrcPrefix = createAbstraction<IDefaultSrcPrefix>(
    "FileManager/DefaultSrcPrefix"
);

export namespace DefaultSrcPrefix {
    export type Interface = IDefaultSrcPrefix;
}
