import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";

export type FileStorageS3 = Plugin & {
    type: "api-file-manager-storage";
    name: "api-file-manager-storage";
    // TODO: @ashutosh add types.
    upload(args: any): Promise<any>;
    delete(args: any): Promise<any>;
};

export interface FileManagerContext extends ContextInterface {
    fileManager: any;
}
