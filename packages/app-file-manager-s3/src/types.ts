import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";

export type AppFileManagerStorageS3 = Plugin & {
    type: "app-file-manager-storage";
    name: "app-file-manager-storage";
    upload(
        file: File,
        options: {
            apolloClient: ApolloClient<Record<string, any>>;
            onProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
        }
    ): Promise<any>;
};
