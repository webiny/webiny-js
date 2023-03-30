import { AcoContext } from "@webiny/api-aco/types";
import { FileManagerContext, File } from "@webiny/api-file-manager/types";
import { Context as BaseContext } from "@webiny/handler/types";

export type FmFileRecordData = Pick<
    File,
    "id" | "key" | "size" | "type" | "name" | "meta" | "createdOn" | "createdBy" | "tags"
>;

export interface FmAcoContext extends BaseContext, AcoContext, FileManagerContext {}
