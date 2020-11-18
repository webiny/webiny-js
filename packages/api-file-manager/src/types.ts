import { Plugin } from "@webiny/plugins/types";

export type FilesResolverListTagsPlugin = Plugin & {
    name: "files-resolver-list-tags";
    resolve(params: { context: any }): any;
};
