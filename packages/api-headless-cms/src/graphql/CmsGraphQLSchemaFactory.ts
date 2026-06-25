import { createAbstraction } from "@webiny/feature/api";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";

export interface ICmsGraphQLSchemaFactory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(): ICmsGraphQLSchemaPlugin<any>[] | Promise<ICmsGraphQLSchemaPlugin<any>[]>;
}

export const CmsGraphQLSchemaFactory =
    createAbstraction<ICmsGraphQLSchemaFactory>("CmsGraphQLSchemaFactory");

export namespace CmsGraphQLSchemaFactory {
    export type Interface = ICmsGraphQLSchemaFactory;
}
