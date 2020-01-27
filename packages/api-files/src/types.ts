import { Plugin } from "@webiny/api/types";

export type FilesResolverListTagsPlugin = Plugin & {
    name: "files-resolver-list-tags";
    resolve(params: { context: any }): any;
};
