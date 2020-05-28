import { Plugin, Context } from "@webiny/graphql/types";

export type FilesResolverListTagsPlugin = Plugin & {
    name: "files-resolver-list-tags";
    resolve(params: { context: any }): any;
};

export type ContextFilesGetSettings<T = Context> = Plugin & {
    name: "context-files-get-settings";
    resolve(params: { context: T }): Promise<any[]>;
};