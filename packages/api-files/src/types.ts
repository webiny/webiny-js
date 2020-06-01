import { Plugin } from "@webiny/graphql/types";

export type FilesResolverListTagsPlugin = Plugin & {
    name: "files-resolver-list-tags";
    resolve(params: { context: any }): any;
};
