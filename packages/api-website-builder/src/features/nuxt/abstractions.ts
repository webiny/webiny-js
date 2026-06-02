import { createAbstraction } from "@webiny/feature/api";
import type { IMarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";

export interface INuxtConfig {
    execute(): Promise<IMarkdownContentBuilder>;
}

/** Configuration for Nuxt website rendering. */
export const NuxtConfig = createAbstraction<INuxtConfig>("Wb/NuxtConfig");
export namespace NuxtConfig {
    export type Interface = INuxtConfig;
    export type Return = Promise<IMarkdownContentBuilder>;
}
