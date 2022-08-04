import { createHandler } from "@webiny/handler-aws/gateway";
import { createDownloadFilePlugins } from "@webiny/api-file-manager/handlers/download";

export const handler = createHandler({
    plugins: [createDownloadFilePlugins()],
    lambdaOptions: {
        binaryMimeTypes: {
            indexOf: () => {
                return 1;
            }
        } as unknown as string[]
    }
});
