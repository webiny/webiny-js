import { HandlerContext } from "@webiny/handler/types";

export type Action =
    | "copyEnvironment"
    | "deleteEnvironment"
    | "generateRevisionIndexes"
    | "deleteRevisionIndexes"
    | "generateContentModelIndexes";

export type CmsDataManagerHookType = "entry-update" | "entry-delete";

interface CmsDataManagerHookParams {
    type: CmsDataManagerHookType;
    environment: string;
    contentModel: string;
    entry: { [key: string]: any };
}

export type CmsDataManagerHookPlugin = Plugin & {
    type: "cms-data-manager-hook";
    hook(params: CmsDataManagerHookParams, context: HandlerContext): Promise<void>;
};
