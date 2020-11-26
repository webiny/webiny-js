import { Plugin } from "@webiny/plugins/types";

export type FileStorageS3 = Plugin & {
    type: "api-file-manager-storage";
    name: "api-file-manager-storage-s3";
    // TODO: @ashutosh add types.
    upload(args: any): Promise<any>;
    delete(args: any): Promise<any>;
};
