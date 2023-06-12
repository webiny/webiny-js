import { createHandler } from "@webiny/handler-aws/raw";
import queueProcessPlugins from "~/queue/process";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { PrerenderingServiceStorageOperations } from "~/types";

export default (...plugins: any[]) => {
    const { storageOperations } =
        getStorageOps<PrerenderingServiceStorageOperations>("prerenderingService");

    const handler = createHandler({
        plugins: [
            ...plugins,
            queueProcessPlugins({
                handlers: {
                    render: "handler-client-handler-render-handler",
                    flush: "handler-client-handler-flush-handler"
                },
                storageOperations
            })
        ]
    });

    return { handler, storageOperations };
};
