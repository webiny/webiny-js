import { HandlerContext } from "@webiny/handler/types";

export type Action =
    | "copyEnvironment"
    | "deleteEnvironment"
    | "generateRevisionIndexes"
    | "deleteRevisionIndexes"
    | "generateContentModelIndexes";

export type CmsDataManagerEntryHookType = "entry-update" | "entry-delete";

interface CmsDataManagerEntryHookParams {
    type: CmsDataManagerEntryHookType;
    environment: string;
    contentModel: string;
    entry: { id: string; published: boolean; latestVersion: boolean };
}

export type CmsDataManagerEntryHookPlugin = Plugin & {
    type: "cms-data-manager-entry-hook";
    hook(params: CmsDataManagerEntryHookParams, context: HandlerContext): Promise<void>;
};
