import { createAbstraction } from "@webiny/feature/api";
import type { IMarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";

export interface INextjsConfig {
    execute(): Promise<IMarkdownContentBuilder>;
}

/** Configuration for Next.js website rendering. */
export const NextjsConfig = createAbstraction<INextjsConfig>("Wb/NextjsConfig");
export namespace NextjsConfig {
    export type Interface = INextjsConfig;
    export type Return = Promise<IMarkdownContentBuilder>;
}
